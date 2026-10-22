import React, { useState } from 'react';
import { UnoCard, UnoColor, ThemeConfig, HouseRules } from '../types/uno';
import { CardView } from './CardView';
import { canPlayCard, canJumpIn } from '../utils/deck';
import { ArrowUpDown, ShieldAlert } from 'lucide-react';

interface PlayerHandViewProps {
  cards: UnoCard[];
  topCard: UnoCard | null;
  activeColor: UnoColor;
  stackedDrawCount: number;
  rules: HouseRules;
  isMyTurn: boolean;
  onPlayCard: (card: UnoCard) => void;
  onJumpIn?: (card: UnoCard) => void;
  theme: ThemeConfig;
  hasCalledUno: boolean;
}

export const PlayerHandView: React.FC<PlayerHandViewProps> = ({
  cards,
  topCard,
  activeColor,
  stackedDrawCount,
  rules,
  isMyTurn,
  onPlayCard,
  onJumpIn,
  theme,
  hasCalledUno,
}) => {
  const [sortBy, setSortBy] = useState<'color' | 'value'>('color');

  // Sort helper
  const sortedCards = [...cards].sort((a, b) => {
    if (sortBy === 'color') {
      const colorOrder = { red: 1, blue: 2, green: 3, yellow: 4, wild: 5 };
      if (colorOrder[a.color] !== colorOrder[b.color]) {
        return colorOrder[a.color] - colorOrder[b.color];
      }
      return a.value.localeCompare(b.value);
    } else {
      if (a.value !== b.value) {
        return a.value.localeCompare(b.value);
      }
      return a.color.localeCompare(b.color);
    }
  });

  const toggleSort = () => {
    setSortBy(prev => (prev === 'color' ? 'value' : 'color'));
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Hand Controls Bar */}
      <div className="w-full flex items-center justify-between px-4 py-1 text-xs text-neutral-300 font-semibold mb-1">
        <div className="flex items-center gap-2">
          <span className="bg-neutral-800/80 px-2.5 py-1 rounded-full border border-neutral-700">
            بطاقاتك: <strong className="text-amber-400 text-sm">{cards.length}</strong>
          </span>
          {cards.length === 1 && (
            <span
              className={`px-2.5 py-1 rounded-full border font-black text-xs flex items-center gap-1 ${
                hasCalledUno
                  ? 'bg-emerald-600/90 border-emerald-400 text-white'
                  : 'bg-red-600/90 border-red-400 text-white animate-pulse'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {hasCalledUno ? 'تم إعلان أونو! ✓' : 'حذار! اضغط زر أونو!'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={toggleSort}
          className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 rounded-lg border border-neutral-700 transition-colors shadow-xs"
        >
          <ArrowUpDown className="w-3 h-3 text-amber-400" />
          <span>ترتيب حسب: {sortBy === 'color' ? 'اللون' : 'القيمة'}</span>
        </button>
      </div>

      {/* Cards Scroll Container */}
      <div className="w-full overflow-x-auto pb-4 pt-6 px-4 no-scrollbar flex items-end justify-center min-h-[140px] sm:min-h-[175px]">
        <div className="flex items-end -space-x-8 sm:-space-x-12 rtl:space-x-reverse transition-all duration-300">
          {sortedCards.map((card, index) => {
            const isPlayable = isMyTurn && canPlayCard(card, topCard, activeColor, stackedDrawCount, rules);
            const canJump = !isMyTurn && rules.jumpInRule && canJumpIn(card, topCard);

            return (
              <div
                key={card.id || `hand_card_${index}`}
                className="transition-transform duration-200 hover:z-30 hover:-translate-y-6 focus-within:z-30"
              >
                <CardView
                  card={card}
                  isFaceUp={true}
                  isPlayable={isPlayable || canJump}
                  size="md"
                  theme={theme}
                  onClick={() => {
                    if (isPlayable) {
                      onPlayCard(card);
                    } else if (canJump && onJumpIn) {
                      onJumpIn(card);
                    }
                  }}
                  className={`${canJump ? 'ring-4 ring-purple-400 animate-bounce' : ''}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
