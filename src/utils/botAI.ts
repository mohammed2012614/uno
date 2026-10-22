import { UnoCard, UnoColor, Player, HouseRules, BotDifficulty } from '../types/uno';
import { canPlayCard } from './deck';

export interface BotDecision {
  cardToPlay: UnoCard | null; // null means draw
  chosenColor: UnoColor;
  shouldCallUno: boolean;
  swapTargetPlayerId?: string; // for 7-0 rule
  shouldChallengeUnoTargetId?: string; // catch player forgetting UNO
}

/**
 * Intelligent Bot AI logic for Easy, Medium, and Hard difficulties
 */
export function decideBotMove(
  bot: Player,
  allPlayers: Player[],
  currentDirection: 1 | -1,
  topCard: UnoCard | null,
  activeColor: UnoColor,
  stackedDrawCount: number,
  rules: HouseRules,
  playerWeakColors?: Record<string, UnoColor[]> // recorded colors players couldn't play
): BotDecision {
  const difficulty: BotDifficulty = bot.botDifficulty || 'medium';
  const hand = bot.cards;

  // 1. Identify all playable cards
  const playableCards = hand.filter(card =>
    canPlayCard(card, topCard, activeColor, stackedDrawCount, rules)
  );

  // Check if any opponent forgot to call UNO
  let shouldChallengeUnoTargetId: string | undefined = undefined;
  if (rules.unoCallPenalty) {
    const vulnerableOpponent = allPlayers.find(
      p => p.id !== bot.id && p.cards.length === 1 && !p.hasCalledUno
    );
    if (vulnerableOpponent) {
      if (difficulty === 'hard') {
        shouldChallengeUnoTargetId = vulnerableOpponent.id;
      } else if (difficulty === 'medium' && Math.random() < 0.7) {
        shouldChallengeUnoTargetId = vulnerableOpponent.id;
      } else if (difficulty === 'easy' && Math.random() < 0.3) {
        shouldChallengeUnoTargetId = vulnerableOpponent.id;
      }
    }
  }

  // Next player in turn order
  const botIndex = allPlayers.findIndex(p => p.id === bot.id);
  const nextIndex = (botIndex + currentDirection + allPlayers.length) % allPlayers.length;
  const nextPlayer = allPlayers[nextIndex];
  const nextPlayerIsDanger = nextPlayer && nextPlayer.cards.length <= 2;

  // If no playable card, must draw
  if (playableCards.length === 0) {
    return {
      cardToPlay: null,
      chosenColor: activeColor,
      shouldCallUno: false,
      shouldChallengeUnoTargetId,
    };
  }

  let selectedCard: UnoCard;

  if (difficulty === 'easy') {
    // Easy Bot: randomly picks any playable card
    selectedCard = playableCards[Math.floor(Math.random() * playableCards.length)];
  } else if (difficulty === 'medium') {
    // Medium Bot: Saves wilds unless needed, prioritizes +2/skip if next player has few cards
    if (nextPlayerIsDanger) {
      const attackCard = playableCards.find(c => c.value === 'draw2' || c.value === 'skip' || c.value === 'reverse' || c.value === 'wild4');
      if (attackCard) {
        selectedCard = attackCard;
      } else {
        selectedCard = pickNonWildIfPossible(playableCards);
      }
    } else {
      selectedCard = pickNonWildIfPossible(playableCards);
    }
  } else {
    // Hard / Master Bot: High strategy
    if (nextPlayerIsDanger) {
      // Aggressively attack next player with +4, +2, Skip, Reverse
      const superAttack = playableCards.find(c => c.value === 'wild4' || c.value === 'draw2');
      const tempoAttack = playableCards.find(c => c.value === 'skip' || c.value === 'reverse');
      if (superAttack) {
        selectedCard = superAttack;
      } else if (tempoAttack) {
        selectedCard = tempoAttack;
      } else {
        selectedCard = pickBestHardCard(playableCards, hand);
      }
    } else {
      selectedCard = pickBestHardCard(playableCards, hand);
    }
  }

  // Determine best color if a Wild card is selected
  const chosenColor = pickBestColor(bot.cards, difficulty, playerWeakColors, nextPlayer?.id);

  // UNO declaration logic: Bot with 2 cards playing 1 card will have 1 card left!
  let shouldCallUno = false;
  if (bot.cards.length === 2) {
    if (difficulty === 'hard') {
      shouldCallUno = true; // Hard never forgets
    } else if (difficulty === 'medium') {
      shouldCallUno = Math.random() < 0.92; // 92% rate
    } else {
      shouldCallUno = Math.random() < 0.65; // 65% rate (allows user to challenge!)
    }
  }

  // 7-0 Rule: if playing a 7, pick player with fewest cards to swap with!
  let swapTargetPlayerId: string | undefined = undefined;
  if (rules.sevenZeroRule && selectedCard.value === '7') {
    const opponents = allPlayers.filter(p => p.id !== bot.id);
    if (opponents.length > 0) {
      // Sort opponents by fewest cards
      opponents.sort((a, b) => a.cards.length - b.cards.length);
      const bestTarget = opponents[0];
      // Only swap if opponent has fewer cards than bot
      if (bestTarget.cards.length < bot.cards.length) {
        swapTargetPlayerId = bestTarget.id;
      }
    }
  }

  return {
    cardToPlay: selectedCard,
    chosenColor,
    shouldCallUno,
    swapTargetPlayerId,
    shouldChallengeUnoTargetId,
  };
}

function pickNonWildIfPossible(cards: UnoCard[]): UnoCard {
  const nonWilds = cards.filter(c => c.color !== 'wild');
  if (nonWilds.length > 0) {
    return nonWilds[Math.floor(Math.random() * nonWilds.length)];
  }
  return cards[0];
}

function pickBestHardCard(playableCards: UnoCard[], fullHand: UnoCard[]): UnoCard {
  // Count frequency of colors in hand
  const colorCounts: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
  fullHand.forEach(c => {
    if (c.color !== 'wild') colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
  });

  // Prefer playing a normal card of the color bot holds most of
  const sorted = [...playableCards].sort((a, b) => {
    // Save wilds for later unless forced
    const aIsWild = a.color === 'wild';
    const bIsWild = b.color === 'wild';
    if (aIsWild && !bIsWild) return 1;
    if (!aIsWild && bIsWild) return -1;

    // Highest points cards discarded first (e.g. Draw 2 / Reverse before normal numbers)
    const getValWeight = (val: string) => {
      if (val === 'draw2') return 30;
      if (val === 'skip' || val === 'reverse') return 25;
      if (val >= '0' && val <= '9') return parseInt(val, 10);
      return 0;
    };

    const countA = colorCounts[a.color] || 0;
    const countB = colorCounts[b.color] || 0;
    if (countA !== countB) return countB - countA;
    return getValWeight(b.value) - getValWeight(a.value);
  });

  return sorted[0];
}

function pickBestColor(
  hand: UnoCard[],
  difficulty: BotDifficulty,
  playerWeakColors?: Record<string, UnoColor[]>,
  nextPlayerId?: string
): UnoColor {
  const colors: UnoColor[] = ['red', 'blue', 'green', 'yellow'];

  if (difficulty === 'easy') {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Count cards by color in bot's hand
  const counts: Record<UnoColor, number> = { red: 0, blue: 0, green: 0, yellow: 0, wild: 0 };
  hand.forEach(c => {
    if (c.color !== 'wild') counts[c.color]++;
  });

  // If hard difficulty and next player is dangerous, check their known weak colors
  if (difficulty === 'hard' && nextPlayerId && playerWeakColors && playerWeakColors[nextPlayerId]) {
    const weakList = playerWeakColors[nextPlayerId];
    // Find color that next player couldn't play and bot also holds
    const goodDisruptColor = colors.find(c => weakList.includes(c) && counts[c] > 0);
    if (goodDisruptColor) {
      return goodDisruptColor;
    }
  }

  // Pick color with max count
  let maxCount = -1;
  let bestColor: UnoColor = 'red';
  colors.forEach(col => {
    if (counts[col] > maxCount) {
      maxCount = counts[col];
      bestColor = col;
    }
  });

  return bestColor;
}
