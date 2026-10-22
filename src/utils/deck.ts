import { UnoCard, UnoColor, UnoValue, HouseRules, ThemeConfig, ThemeId } from '../types/uno';

export const THEMES: Record<ThemeId, ThemeConfig> = {
  classic: {
    id: 'classic',
    nameAr: 'أونو الكلاسيكي',
    nameEn: 'Classic UNO',
    colors: {
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#22c55e',
      yellow: '#eab308',
      wild: '#18181b',
      cardBack: '#b91c1c',
      background: '#0f172a',
    },
    cardBorder: '#ffffff',
  },
  neon: {
    id: 'neon',
    nameAr: 'نيون أركيد المشع',
    nameEn: 'Neon Arcade',
    colors: {
      red: '#ff0055',
      blue: '#00d2ff',
      green: '#00ff88',
      yellow: '#ffe600',
      wild: '#110022',
      cardBack: '#4c0519',
      background: '#090214',
    },
    cardBorder: '#ff00ff',
  },
  cyberpunk: {
    id: 'cyberpunk',
    nameAr: 'سايبر بانك 2099',
    nameEn: 'Cyberpunk 2099',
    colors: {
      red: '#f43f5e',
      blue: '#06b6d4',
      green: '#10b981',
      yellow: '#facc15',
      wild: '#1e1b4b',
      cardBack: '#0f172a',
      background: '#05070e',
    },
    cardBorder: '#38bdf8',
  },
  royal: {
    id: 'royal',
    nameAr: 'الذهب الملكي الفاخر',
    nameEn: 'Royal Gold & Obsidian',
    colors: {
      red: '#991b1b',
      blue: '#1e40af',
      green: '#166534',
      yellow: '#ca8a04',
      wild: '#18181b',
      cardBack: '#451a03',
      background: '#140c06',
    },
    cardBorder: '#fbbf24',
  },
  candy: {
    id: 'candy',
    nameAr: 'حلوى الباستيل المرحة',
    nameEn: 'Pastel Candy',
    colors: {
      red: '#fb7185',
      blue: '#60a5fa',
      green: '#4ade80',
      yellow: '#fde047',
      wild: '#475569',
      cardBack: '#db2777',
      background: '#1e1026',
    },
    cardBorder: '#fbcfe8',
  },
  desert: {
    id: 'desert',
    nameAr: 'رمال الصحراء الذهبية',
    nameEn: 'Desert Oasis',
    colors: {
      red: '#dc2626',
      blue: '#0284c7',
      green: '#059669',
      yellow: '#d97706',
      wild: '#292524',
      cardBack: '#78350f',
      background: '#1c130b',
    },
    cardBorder: '#f59e0b',
  },
};

/**
 * Generates a full standard 108-card UNO deck plus optional custom wild cards
 */
export function createDeck(customWildName?: string): UnoCard[] {
  const deck: UnoCard[] = [];
  const standardColors: UnoColor[] = ['red', 'blue', 'green', 'yellow'];
  let idCounter = 1;

  for (const color of standardColors) {
    // Exactly 1 zero per color
    deck.push({
      id: `card_${idCounter++}`,
      color,
      value: '0',
    });

    // Exactly 2 of 1-9 per color
    for (let num = 1; num <= 9; num++) {
      const valStr = num.toString() as UnoValue;
      deck.push({ id: `card_${idCounter++}`, color, value: valStr });
      deck.push({ id: `card_${idCounter++}`, color, value: valStr });
    }

    // Exactly 2 of Action cards per color
    const actionValues: UnoValue[] = ['skip', 'reverse', 'draw2'];
    for (const act of actionValues) {
      deck.push({ id: `card_${idCounter++}`, color, value: act });
      deck.push({ id: `card_${idCounter++}`, color, value: act });
    }
  }

  // 4 Standard Wild Cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_${idCounter++}`, color: 'wild', value: 'wild' });
  }

  // 4 Wild Draw Four Cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_${idCounter++}`, color: 'wild', value: 'wild4' });
  }

  // Optional Custom Wild Cards if edition has one
  if (customWildName && customWildName.trim()) {
    for (let i = 0; i < 2; i++) {
      deck.push({
        id: `card_${idCounter++}`,
        color: 'wild',
        value: 'wild_custom',
        customName: customWildName.trim(),
      });
    }
  }

  return shuffleDeck(deck);
}

/**
 * Fisher-Yates array shuffle
 */
export function shuffleDeck(cards: UnoCard[]): UnoCard[] {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Check if a card is legally playable on top of current topCard
 */
export function canPlayCard(
  card: UnoCard,
  topCard: UnoCard | null,
  activeColor: UnoColor,
  stackedDrawCount: number,
  rules: HouseRules
): boolean {
  if (!topCard) return true;

  // If there is an active stacked draw penalty (+2 or +4 accumulated)
  if (stackedDrawCount > 0) {
    if (rules.stackDrawTwo && topCard.value === 'draw2' && card.value === 'draw2') {
      return true;
    }
    if (rules.stackDrawFour && topCard.value === 'wild4' && card.value === 'wild4') {
      return true;
    }
    // Cannot play non-stacking card while under draw penalty
    return false;
  }

  // Wild cards can always be played
  if (card.color === 'wild' || card.value === 'wild' || card.value === 'wild4' || card.value === 'wild_custom') {
    return true;
  }

  // Color match (activeColor accounts for Wild changes)
  if (card.color === activeColor) {
    return true;
  }

  // Value match (e.g. 7 on 7, skip on skip, even across colors)
  if (card.value === topCard.value) {
    return true;
  }

  return false;
}

/**
 * Check Jump-In: Exact same color AND exact same value
 */
export function canJumpIn(card: UnoCard, topCard: UnoCard | null): boolean {
  if (!topCard) return false;
  if (card.color === 'wild' || topCard.color === 'wild') return false;
  return card.color === topCard.color && card.value === topCard.value;
}

/**
 * Calculate scores for end of round
 */
export function calculateHandPoints(cards: UnoCard[]): number {
  return cards.reduce((sum, card) => {
    if (card.value >= '0' && card.value <= '9') {
      return sum + parseInt(card.value, 10);
    }
    if (card.value === 'skip' || card.value === 'reverse' || card.value === 'draw2') {
      return sum + 20;
    }
    if (card.value === 'wild' || card.value === 'wild4' || card.value === 'wild_custom') {
      return sum + 50;
    }
    return sum;
  }, 0);
}
