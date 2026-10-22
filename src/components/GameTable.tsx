import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  UnoCard,
  UnoColor,
  Player,
  HouseRules,
  CustomEdition,
  GameActionLog,
  BotDifficulty,
} from '../types/uno';
import { createDeck, canPlayCard, THEMES } from '../utils/deck';
import { decideBotMove } from '../utils/botAI';
import { sounds } from '../utils/audio';
import { useAuth } from '../firebase/authContext';
import { TableCenter } from './TableCenter';
import { PlayerHandView } from './PlayerHandView';
import { OpponentView } from './OpponentView';
import { ColorPickerModal } from './ColorPickerModal';
import { UnoCallButton } from './UnoCallButton';
import {
  Trophy,
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface GameTableProps {
  edition?: CustomEdition | null;
  botDifficulty: BotDifficulty;
  botCount: number;
  onExitGame: () => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  edition,
  botDifficulty,
  botCount,
  onExitGame,
}) => {
  const { user, awardMatchStats } = useAuth();

  // Active theme and rules
  const theme = edition ? THEMES[edition.theme] || THEMES.classic : THEMES.classic;
  const rules: HouseRules = edition ? edition.rules : {
    stackDrawTwo: true,
    stackDrawFour: true,
    sevenZeroRule: false,
    jumpInRule: true,
    drawToMatch: false,
    forcePlay: true,
    unoCallPenalty: true,
  };

  // Game state
  const [deck, setDeck] = useState<UnoCard[]>([]);
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = clockwise, -1 = counter-clockwise
  const [activeColor, setActiveColor] = useState<UnoColor>('red');
  const [stackedDrawCount, setStackedDrawCount] = useState<number>(0);
  const [winner, setWinner] = useState<Player | null>(null);

  // Modals & UI states
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<UnoCard | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [pendingSevenCard, setPendingSevenCard] = useState<UnoCard | null>(null);

  // Sound mute state
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  // Action logs
  const [logs, setLogs] = useState<GameActionLog[]>([]);

  // Ref to track bot loop execution safely without stale state
  const isProcessingTurnRef = useRef(false);

  // Initialize Game on Mount
  useEffect(() => {
    startNewGame();
  }, []);

  const addLog = (textAr: string, type: GameActionLog['type'] = 'play') => {
    const newLog: GameActionLog = {
      id: `log_${Date.now()}_${Math.random()}`,
      textAr,
      textEn: '',
      timestamp: Date.now(),
      type,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 5)]);
  };

  const startNewGame = () => {
    // 1. Build initial deck
    const newDeck = createDeck(edition?.customWildName);

    // 2. Build players (User + bots)
    const initialPlayers: Player[] = [
      {
        id: user?.uid || 'human_player',
        name: user?.displayName || 'أنت (البطل)',
        avatar: user?.photoURL || '',
        isBot: false,
        cards: [],
        hasCalledUno: false,
        score: 0,
      },
    ];

    const botNames = ['كريم الذكي', 'سارة المحترفة', 'عمر الداهية'];
    for (let i = 0; i < botCount; i++) {
      initialPlayers.push({
        id: `bot_${i + 1}`,
        name: botNames[i] || `بوت ${i + 1}`,
        avatar: '',
        isBot: true,
        botDifficulty,
        cards: [],
        hasCalledUno: false,
        score: 0,
      });
    }

    // Deal 7 cards to each player
    let deckIndex = 0;
    initialPlayers.forEach((p) => {
      p.cards = newDeck.slice(deckIndex, deckIndex + 7);
      deckIndex += 7;
    });

    // Pick top card that is NOT wild for clean start
    let topCard = newDeck[deckIndex++];
    while (topCard.color === 'wild' && deckIndex < newDeck.length) {
      topCard = newDeck[deckIndex++];
    }

    const remainingDeck = newDeck.slice(deckIndex);

    setDeck(remainingDeck);
    setDiscardPile([topCard]);
    setPlayers(initialPlayers);
    setActiveColor(topCard.color);
    setCurrentTurnIndex(0);
    setDirection(1);
    setStackedDrawCount(0);
    setWinner(null);
    setLogs([]);
    addLog(`بدأت المباراة! الكرت الأول هو ${topCard.color} ${topCard.value}`, 'play');
    sounds.playDraw();
  };

  // Helper: Draw cards from deck, reshuffling discard pile if deck runs out
  const drawCardsFromDeck = (count: number): { drawn: UnoCard[]; updatedDeck: UnoCard[] } => {
    let currentDeck = [...deck];
    const drawn: UnoCard[] = [];

    for (let i = 0; i < count; i++) {
      if (currentDeck.length === 0) {
        // Reshuffle discard pile except top card
        const currentTop = discardPile[discardPile.length - 1];
        const discardToShuffle = discardPile.slice(0, -1);
        if (discardToShuffle.length === 0) break;
        currentDeck = createDeck().slice(0, 30);
      }
      const card = currentDeck.pop();
      if (card) drawn.push(card);
    }

    return { drawn, updatedDeck: currentDeck };
  };

  // Next player index calculator
  const getNextPlayerIndex = (step: number = 1): number => {
    const total = players.length;
    return (currentTurnIndex + step * direction + total * 10) % total;
  };

  // Execute card play effects (Skip, Reverse, Draw2, Wild4, 7-0)
  const applyCardEffects = (
    playedCard: UnoCard,
    chosenColor: UnoColor,
    targetSwapId?: string
  ) => {
    sounds.playCardSnap();
    let nextStep = 1;
    let newDirection = direction;
    let newStackedDraw = stackedDrawCount;

    // Discard pile update with small random rotation for visual charm
    const rotatedCard: UnoCard = {
      ...playedCard,
      rotation: Math.floor(Math.random() * 20) - 10,
    };
    setDiscardPile((prev) => [...prev, rotatedCard]);
    setActiveColor(chosenColor);

    // Skip
    if (playedCard.value === 'skip') {
      sounds.playAction();
      nextStep = 2;
      const skippedPlayer = players[getNextPlayerIndex(1)];
      addLog(`تم تخطي دور ${skippedPlayer?.name}!`, 'skip');
    }

    // Reverse
    if (playedCard.value === 'reverse') {
      sounds.playAction();
      if (players.length === 2) {
        // In 2 player UNO, Reverse acts like a Skip!
        nextStep = 2;
        addLog(`عكس الاتجاه (تخطي دور الخصم في مباراة ثنائية)!`, 'skip');
      } else {
        newDirection = (direction * -1) as 1 | -1;
        setDirection(newDirection);
        addLog(`تم عكس اتجاه اللعب!`, 'play');
      }
    }

    // Draw 2 (+2)
    if (playedCard.value === 'draw2') {
      sounds.playAction();
      if (rules.stackDrawTwo) {
        newStackedDraw += 2;
        setStackedDrawCount(newStackedDraw);
        addLog(`سحب +2 تراكمي! الإجمالي المطلوب: ${newStackedDraw}`, 'play');
      } else {
        // Immediate penalty to next player
        const targetIndex = getNextPlayerIndex(1);
        penalizePlayer(targetIndex, 2);
        nextStep = 2;
      }
    }

    // Wild Draw Four (+4)
    if (playedCard.value === 'wild4') {
      sounds.playWild();
      if (rules.stackDrawFour) {
        newStackedDraw += 4;
        setStackedDrawCount(newStackedDraw);
        addLog(`سحب +4 تراكمي! الإجمالي المطلوب: ${newStackedDraw}`, 'play');
      } else {
        const targetIndex = getNextPlayerIndex(1);
        penalizePlayer(targetIndex, 4);
        nextStep = 2;
      }
    }

    // Wild / Custom Wild sound
    if (playedCard.value === 'wild' || playedCard.value === 'wild_custom') {
      sounds.playWild();
      addLog(`تم تغيير اللون إلى ${chosenColor}!`, 'play');
    }

    // 7-0 Rule
    if (rules.sevenZeroRule) {
      if (playedCard.value === '7' && targetSwapId) {
        swapHands(players[currentTurnIndex].id, targetSwapId);
      } else if (playedCard.value === '0') {
        rotateAllHands(newDirection);
      }
    }

    // Check Win Condition
    const currentPlayer = players[currentTurnIndex];
    if (currentPlayer.cards.length === 0) {
      handleVictory(currentPlayer);
      return;
    }

    // Move to next player
    const nextIndex = (currentTurnIndex + nextStep * newDirection + players.length * 10) % players.length;
    setCurrentTurnIndex(nextIndex);
  };

  // Penalize player with card draws
  const penalizePlayer = (playerIndex: number, cardCount: number) => {
    const { drawn, updatedDeck } = drawCardsFromDeck(cardCount);
    setDeck(updatedDeck);
    setPlayers((prev) => {
      const copy = [...prev];
      copy[playerIndex] = {
        ...copy[playerIndex],
        cards: [...copy[playerIndex].cards, ...drawn],
        hasCalledUno: false,
      };
      return copy;
    });
    addLog(`سحب ${players[playerIndex]?.name} ${cardCount} بطاقات عقوبة!`, 'draw');
  };

  // Swap hands between 2 players (7 rule)
  const swapHands = (playerAId: string, playerBId: string) => {
    setPlayers((prev) => {
      const idxA = prev.findIndex((p) => p.id === playerAId);
      const idxB = prev.findIndex((p) => p.id === playerBId);
      if (idxA === -1 || idxB === -1) return prev;
      const copy = [...prev];
      const tempCards = copy[idxA].cards;
      copy[idxA] = { ...copy[idxA], cards: copy[idxB].cards, hasCalledUno: false };
      copy[idxB] = { ...copy[idxB], cards: tempCards, hasCalledUno: false };
      return copy;
    });
    addLog(`تم تبديل الأيدي بين اللاعبين وفقاً لقاعدة الرقم 7!`, 'swap');
  };

  // Rotate all hands in play direction (0 rule)
  const rotateAllHands = (dir: 1 | -1) => {
    setPlayers((prev) => {
      const copy = [...prev];
      const handList = copy.map((p) => p.cards);
      return copy.map((p, i) => {
        const fromIdx = (i - dir + copy.length) % copy.length;
        return { ...p, cards: handList[fromIdx], hasCalledUno: false };
      });
    });
    addLog(`دارت جميع الأيدي باتجاه اللعب وفقاً لقاعدة الرقم 0!`, 'swap');
  };

  // Human player plays a card
  const handleHumanPlayCard = (card: UnoCard) => {
    if (winner) return;
    const humanPlayer = players[currentTurnIndex];
    if (humanPlayer.isBot) return;

    // Check if card is Wild and needs color selection
    if (card.color === 'wild' || card.value === 'wild' || card.value === 'wild4' || card.value === 'wild_custom') {
      setPendingWildCard(card);
      setIsColorPickerOpen(true);
      return;
    }

    // Check if card is 7 and 7-0 rule is active
    if (rules.sevenZeroRule && card.value === '7') {
      setPendingSevenCard(card);
      setIsSwapModalOpen(true);
      return;
    }

    // Play card immediately
    executeCardMove(card, card.color);
  };

  // When human selects a color from the ColorPicker modal
  const handleColorSelected = (chosenColor: UnoColor) => {
    setIsColorPickerOpen(false);
    if (!pendingWildCard) return;

    const card = pendingWildCard;
    setPendingWildCard(null);

    executeCardMove(card, chosenColor);
  };

  // Execute card move from hand
  const executeCardMove = (card: UnoCard, chosenColor: UnoColor, targetSwapId?: string) => {
    // Remove card from current player's hand
    setPlayers((prev) => {
      const copy = [...prev];
      const p = copy[currentTurnIndex];
      const updatedCards = p.cards.filter((c) => c.id !== card.id);
      copy[currentTurnIndex] = {
        ...p,
        cards: updatedCards,
      };
      return copy;
    });

    applyCardEffects(card, chosenColor, targetSwapId);
  };

  // Human player draws a card
  const handleHumanDrawCard = () => {
    if (winner) return;
    const humanPlayer = players[currentTurnIndex];
    if (humanPlayer.isBot) return;

    sounds.playDraw();

    // If there is stacked draw penalty (+2 or +4 accumulated) and player couldn't stack:
    if (stackedDrawCount > 0) {
      penalizePlayer(currentTurnIndex, stackedDrawCount);
      setStackedDrawCount(0);
      setCurrentTurnIndex(getNextPlayerIndex(1));
      return;
    }

    // Normal draw: draw 1 card (or draw until playable if drawToMatch)
    const { drawn, updatedDeck } = drawCardsFromDeck(1);
    setDeck(updatedDeck);

    if (drawn.length > 0) {
      const newCard = drawn[0];
      const topCard = discardPile[discardPile.length - 1];
      const isPlayable = canPlayCard(newCard, topCard, activeColor, stackedDrawCount, rules);

      if (rules.forcePlay && isPlayable) {
        // Automatically play drawn card if forcePlay is on
        setPlayers((prev) => {
          const copy = [...prev];
          copy[currentTurnIndex] = { ...copy[currentTurnIndex], cards: [...copy[currentTurnIndex].cards, newCard] };
          return copy;
        });
        addLog(`سحبت ولعبت فوراً: ${newCard.color} ${newCard.value}`, 'play');
        handleHumanPlayCard(newCard);
      } else {
        // Add to hand and pass turn
        setPlayers((prev) => {
          const copy = [...prev];
          copy[currentTurnIndex] = {
            ...copy[currentTurnIndex],
            cards: [...copy[currentTurnIndex].cards, newCard],
            hasCalledUno: false,
          };
          return copy;
        });
        addLog(`سحبت بطاقة واحدة`, 'draw');
        setCurrentTurnIndex(getNextPlayerIndex(1));
      }
    }
  };

  // Human shouts UNO!
  const handleCallUno = () => {
    const humanPlayer = players[0];
    if (humanPlayer.hasCalledUno) return;

    sounds.playUnoCall();
    setPlayers((prev) => {
      const copy = [...prev];
      copy[0] = { ...copy[0], hasCalledUno: true };
      return copy;
    });
    addLog(`أعلنت "أونو!" بصوت عالٍ! 🔥`, 'uno');
  };

  // Catch opponent who forgot to shout UNO
  const handleCatchOpponentUno = (targetOpponent?: Player) => {
    const vulnerable = targetOpponent || players.find((p, idx) => idx !== 0 && p.cards.length === 1 && !p.hasCalledUno);
    if (!vulnerable) return;

    sounds.playChallenge();
    const targetIdx = players.findIndex((p) => p.id === vulnerable.id);
    if (targetIdx !== -1) {
      penalizePlayer(targetIdx, 2);
      addLog(`كشفت نسيان ${vulnerable.name} لإعلان أونو! عوقب بسحب بطاقتين!`, 'challenge');
    }
  };

  // Jump-In execution
  const handleJumpIn = (card: UnoCard) => {
    if (winner) return;
    const humanIndex = 0;
    sounds.playAction();

    // Remove card from human hand
    setPlayers((prev) => {
      const copy = [...prev];
      copy[humanIndex] = {
        ...copy[humanIndex],
        cards: copy[humanIndex].cards.filter((c) => c.id !== card.id),
      };
      return copy;
    });

    addLog(`قفزت ولعبت ${card.color} ${card.value} خارج دورك! (Jump-In)`, 'play');
    // Turn transfers to after human
    setCurrentTurnIndex(humanIndex);
    applyCardEffects(card, card.color);
  };

  // Bot Turn Automation Loop
  useEffect(() => {
    if (winner || players.length === 0) return;

    const currentPlayer = players[currentTurnIndex];
    if (!currentPlayer || !currentPlayer.isBot) return;

    // Avoid concurrent runs
    if (isProcessingTurnRef.current) return;
    isProcessingTurnRef.current = true;

    // Bot thinking delay (Easy: 1.5s, Medium: 1.2s, Hard: 0.9s)
    const delay = botDifficulty === 'easy' ? 1500 : botDifficulty === 'medium' ? 1200 : 900;

    const timer = setTimeout(() => {
      try {
        const topCard = discardPile[discardPile.length - 1];
        const decision = decideBotMove(
          currentPlayer,
          players,
          direction,
          topCard,
          activeColor,
          stackedDrawCount,
          rules
        );

        // Check if Bot caught opponent forgetting UNO
        if (decision.shouldChallengeUnoTargetId) {
          const target = players.find((p) => p.id === decision.shouldChallengeUnoTargetId);
          if (target && target.cards.length === 1 && !target.hasCalledUno) {
            handleCatchOpponentUno(target);
          }
        }

        // Check if Bot calls UNO
        if (decision.shouldCallUno) {
          sounds.playUnoCall();
          setPlayers((prev) => {
            const copy = [...prev];
            copy[currentTurnIndex] = { ...copy[currentTurnIndex], hasCalledUno: true };
            return copy;
          });
          addLog(`${currentPlayer.name} أعلن "أونو!"`, 'uno');
        }

        if (decision.cardToPlay) {
          // Bot plays card
          const played = decision.cardToPlay;
          setPlayers((prev) => {
            const copy = [...prev];
            copy[currentTurnIndex] = {
              ...copy[currentTurnIndex],
              cards: copy[currentTurnIndex].cards.filter((c) => c.id !== played.id),
            };
            return copy;
          });
          addLog(`${currentPlayer.name} لعب ${played.color} ${played.value}`, 'play');
          applyCardEffects(played, decision.chosenColor, decision.swapTargetPlayerId);
        } else {
          // Bot must draw
          sounds.playDraw();
          if (stackedDrawCount > 0) {
            penalizePlayer(currentTurnIndex, stackedDrawCount);
            setStackedDrawCount(0);
            setCurrentTurnIndex(getNextPlayerIndex(1));
          } else {
            const { drawn, updatedDeck } = drawCardsFromDeck(1);
            setDeck(updatedDeck);
            if (drawn.length > 0) {
              setPlayers((prev) => {
                const copy = [...prev];
                copy[currentTurnIndex] = {
                  ...copy[currentTurnIndex],
                  cards: [...copy[currentTurnIndex].cards, ...drawn],
                  hasCalledUno: false,
                };
                return copy;
              });
              addLog(`${currentPlayer.name} سحب بطاقة`, 'draw');
            }
            setCurrentTurnIndex(getNextPlayerIndex(1));
          }
        }
      } finally {
        isProcessingTurnRef.current = false;
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      isProcessingTurnRef.current = false;
    };
  }, [currentTurnIndex, winner, discardPile, activeColor, stackedDrawCount]);

  // Victory Handler
  const handleVictory = (winningPlayer: Player) => {
    setWinner(winningPlayer);
    sounds.playVictory();

    const isHumanWinner = winningPlayer.id === (user?.uid || 'human_player');
    if (isHumanWinner) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      // Award XP and achievements in Firebase Auth Context!
      awardMatchStats(true, 1);
    } else {
      awardMatchStats(false, 0);
    }
  };

  const topCard = discardPile[discardPile.length - 1] || null;
  const isMyTurn = currentTurnIndex === 0 && !winner;
  const humanPlayer = players[0] || { cards: [], hasCalledUno: false };
  const opponents = players.slice(1);
  const canCatchOpponent = opponents.some((p) => p.cards.length === 1 && !p.hasCalledUno);

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-between p-2 sm:p-4 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden select-none">
      {/* Top Bar Controls */}
      <div className="relative z-30 flex items-center justify-between px-3 py-2 bg-neutral-900/80 rounded-2xl border border-neutral-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExitGame}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="الخروج للقائمة"
          >
            <Home className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-black text-white">
              {edition ? edition.title : 'لعبة أونو الكلاسيكية'}
            </span>
            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
              <Bot className="w-3 h-3" />
              <span>مستوى البوت: {botDifficulty === 'hard' ? 'خبير ⚡' : botDifficulty === 'medium' ? 'متوسط ⚔️' : 'مبتدئ 🌱'}</span>
            </span>
          </div>
        </div>

        {/* Turn Indicator & Actions */}
        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(sounds.toggleMute())}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Rematch button */}
          <button
            type="button"
            onClick={startNewGame}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors"
            title="إعادة بدء المباراة"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Opponents Area */}
      <div className="relative z-20 flex items-center justify-around gap-2 px-2 py-2">
        {opponents.map((opponent, i) => (
          <OpponentView
            key={opponent.id}
            player={opponent}
            isCurrentTurn={currentTurnIndex === i + 1}
            position="top"
            onCatchUno={handleCatchOpponentUno}
            canCatchUno={rules.unoCallPenalty}
          />
        ))}
      </div>

      {/* Center Table Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-2">
        <TableCenter
          topCard={topCard}
          activeColor={activeColor}
          drawPileCount={deck.length}
          direction={direction}
          stackedDrawCount={stackedDrawCount}
          isMyTurn={isMyTurn}
          onDrawCard={handleHumanDrawCard}
          theme={theme}
        />

        {/* Current Turn Notification Banner */}
        <div className="mt-2 text-center">
          {isMyTurn ? (
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-black text-xs sm:text-sm animate-pulse shadow-md">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>دورك الآن! العب بطاقة متوافقة أو اسحب من الكومة</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/80 text-neutral-400 font-semibold text-xs border border-neutral-700">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>دور: {players[currentTurnIndex]?.name}...</span>
            </div>
          )}
        </div>

        {/* Quick action feed */}
        {logs.length > 0 && (
          <div className="mt-1 text-[11px] text-neutral-400 bg-neutral-950/60 px-3 py-0.5 rounded-full border border-neutral-800">
            {logs[0].textAr}
          </div>
        )}
      </div>

      {/* Human Player Hand & Uno Buttons Area */}
      <div className="relative z-20 flex flex-col items-center gap-2">
        {/* Uno Call & Catch buttons */}
        <div className="flex items-center justify-center">
          <UnoCallButton
            playerCardCount={humanPlayer.cards.length}
            hasCalledUno={humanPlayer.hasCalledUno}
            onCallUno={handleCallUno}
            onCatchOpponentUno={handleCatchOpponentUno}
            canCatchOpponent={canCatchOpponent}
          />
        </div>

        {/* Player's Cards Fan */}
        <PlayerHandView
          cards={humanPlayer.cards}
          topCard={topCard}
          activeColor={activeColor}
          stackedDrawCount={stackedDrawCount}
          rules={rules}
          isMyTurn={isMyTurn}
          onPlayCard={handleHumanPlayCard}
          onJumpIn={handleJumpIn}
          theme={theme}
          hasCalledUno={humanPlayer.hasCalledUno}
        />
      </div>

      {/* Color Picker Modal */}
      <ColorPickerModal
        isOpen={isColorPickerOpen}
        onSelectColor={handleColorSelected}
      />

      {/* 7-0 Swap Hand Target Selection Modal */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border-2 border-cyan-500 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-lg font-black text-white mb-2">قاعدة الرقم 7: اختر لاعباً لتبديل الأيدي!</h3>
            <p className="text-xs text-neutral-400 mb-4">
              يمكنك تبديل جميع بطاقاتك مع أي لاعب من الخصوم:
            </p>
            <div className="space-y-2">
              {opponents.map((opp) => (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => {
                    setIsSwapModalOpen(false);
                    if (pendingSevenCard) {
                      executeCardMove(pendingSevenCard, pendingSevenCard.color, opp.id);
                      setPendingSevenCard(null);
                    }
                  }}
                  className="w-full p-3 bg-neutral-800 hover:bg-cyan-600 hover:text-white rounded-xl text-xs font-bold text-neutral-200 flex items-center justify-between transition-colors"
                >
                  <span>{opp.name}</span>
                  <span className="bg-neutral-900 px-2 py-0.5 rounded-full text-amber-400 font-mono">
                    {opp.cards.length} بطاقات
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Victory / Defeat Overlay */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-amber-400 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(250,204,21,0.3)]">
            <div className="w-20 h-20 mx-auto mb-4 bg-amber-500/20 border-2 border-amber-400 rounded-3xl flex items-center justify-center text-amber-400 shadow-xl">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
              {winner.id === (user?.uid || 'human_player') ? 'مبروك! لقد فزت باللعبة! 🎉' : `الفائز هو: ${winner.name}!`}
            </h2>

            <p className="text-neutral-400 text-xs sm:text-sm mb-6">
              {winner.id === (user?.uid || 'human_player')
                ? 'أداء رائع وتكتيك أونو ساحق! تم إضافة نقاط الخبرة لحسابك.'
                : 'حظ أوفر في الجولة القادمة، يمكنك خوض مباراة جديدة أو تعديل القواعد.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={startNewGame}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-black rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>مباراة جديدة</span>
              </button>
              <button
                type="button"
                onClick={onExitGame}
                className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-sm transition-colors"
              >
                القائمة الرئيسية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
