export type UnoColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';

export type UnoValue = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2'
  | 'wild' | 'wild4' | 'wild_custom';

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: UnoValue;
  customName?: string;
  rotation?: number; // visual tilt in discard pile
}

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  cards: UnoCard[];
  hasCalledUno: boolean;
  score: number;
}

export interface HouseRules {
  stackDrawTwo: boolean;      // +2 on top of +2
  stackDrawFour: boolean;     // +4 on top of +4
  sevenZeroRule: boolean;     // 7 swaps hands, 0 rotates hands
  jumpInRule: boolean;        // Play exact match out of turn
  drawToMatch: boolean;       // Keep drawing until playable (or up to 3)
  forcePlay: boolean;         // Must play drawn card if playable
  unoCallPenalty: boolean;    // Catch opponent forgetting UNO (+2 penalty)
}

export const DEFAULT_HOUSE_RULES: HouseRules = {
  stackDrawTwo: true,
  stackDrawFour: true,
  sevenZeroRule: false,
  jumpInRule: false,
  drawToMatch: false,
  forcePlay: true,
  unoCallPenalty: true,
};

export type ThemeId = 'classic' | 'neon' | 'cyberpunk' | 'royal' | 'candy' | 'desert';

export interface ThemeConfig {
  id: ThemeId;
  nameAr: string;
  nameEn: string;
  colors: {
    red: string;
    blue: string;
    green: string;
    yellow: string;
    wild: string;
    cardBack: string;
    background: string;
  };
  cardBorder: string;
}

export interface CustomEdition {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  theme: ThemeId;
  cardBackDesign: string;
  rules: HouseRules;
  customWildName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  xp: number;
  level: number;
  wins: number;
  gamesPlayed: number;
  unoCalls: number;
  achievements: string[];
}

export interface GameActionLog {
  id: string;
  textAr: string;
  textEn: string;
  timestamp: number;
  type: 'play' | 'draw' | 'uno' | 'challenge' | 'skip' | 'swap' | 'win';
}

export interface MultiplayerRoom {
  roomId: string;
  hostId: string;
  hostName: string;
  title: string;
  status: 'waiting' | 'playing' | 'finished';
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  currentTurnIndex: number;
  activePlayerId: string;
  playerIds: string[];
  topCard: UnoCard | null;
  activeColor: UnoColor;
  stackedDrawCount: number;
  winnerId: string | null;
  editionTitle: string;
  rulesPreset: HouseRules;
  lastActionText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomPlayerDoc {
  playerId: string;
  roomId: string;
  name: string;
  avatar: string;
  isReady: boolean;
  cardCount: number;
  hasCalledUno: boolean;
  isBot: boolean;
  joinedAt: string;
}

export interface RoomMessageDoc {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}
