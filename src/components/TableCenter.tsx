import React from 'react';
import { UnoCard, UnoColor, ThemeConfig } from '../types/uno';
import { CardView } from './CardView';
import { RotateCw, RotateCcw, Layers, AlertCircle } from 'lucide-react';

interface TableCenterProps {
  topCard: UnoCard | null;
  activeColor: UnoColor;
  drawPileCount: number;
  direction: 1 | -1;
  stackedDrawCount: number;
  isMyTurn: boolean;
  onDrawCard: () => void;
  theme: ThemeConfig;
  discardHistory?: UnoCard[];
}

export const TableCenter: React.FC<TableCenterProps> = ({
  topCard,
  activeColor,
  drawPileCount,
  direction,
  stackedDrawCount,
  isMyTurn,
  onDrawCard,
  theme,
}) => {
  const colorGlow = {
    red: 'shadow-[0_0_35px_rgba(239,68,68,0.6)] border-red-500',
    blue: 'shadow-[0_0_35px_rgba(59,130,246,0.6)] border-blue-500',
    green: 'shadow-[0_0_35px_rgba(34,197,94,0.6)] border-green-500',
    yellow: 'shadow-[0_0_35px_rgba(234,179,8,0.7)] border-yellow-400',
    wild: 'shadow-[0_0_35px_rgba(168,85,247,0.6)] border-purple-500',
  }[activeColor] || 'shadow-lg border-neutral-700';

  const colorLabelsAr: Record<UnoColor, string> = {
    red: 'أحمر',
    blue: 'أزرق',
    green: 'أخضر',
    yellow: 'أصفر',
    wild: 'أي لون',
  };

  const colorBadgeBg = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-600 text-white',
    green: 'bg-green-600 text-white',
    yellow: 'bg-yellow-400 text-black',
    wild: 'bg-purple-600 text-white',
  }[activeColor];

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Direction & Active Color Aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-56 h-56 sm:w-72 sm:h-72 rounded-full border-2 border-dashed ${colorGlow} opacity-70 transition-all duration-500 flex items-center justify-center`}
        >
          {/* Rotating Direction indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/70 flex items-center gap-1 text-xs font-semibold bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
            {direction === 1 ? (
              <>
                <RotateCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>اتجاه اللعب ↻</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>عكس الاتجاه ↺</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center Table Surface */}
      <div className="relative z-10 flex items-center justify-center gap-4 sm:gap-8">
        {/* Draw Pile */}
        <div className="relative flex flex-col items-center">
          <div className="relative group">
            {/* Stack effect background cards */}
            <div className="absolute -top-1 -right-1 w-20 h-28 sm:w-24 sm:h-36 bg-red-950/80 rounded-xl border border-red-800 rotate-2 pointer-events-none" />
            <div className="absolute -top-2 -right-2 w-20 h-28 sm:w-24 sm:h-36 bg-red-900/60 rounded-xl border border-red-800 -rotate-2 pointer-events-none" />

            <CardView
              card={{ id: 'draw_deck_top', color: 'red', value: '0' }}
              isFaceUp={false}
              size="md"
              theme={theme}
              onClick={isMyTurn ? onDrawCard : undefined}
              className={`${
                isMyTurn
                  ? 'ring-4 ring-yellow-400 animate-pulse hover:scale-105 active:scale-95'
                  : 'opacity-90'
              }`}
            />
          </div>

          {/* Draw button label */}
          <button
            type="button"
            disabled={!isMyTurn}
            onClick={onDrawCard}
            className={`mt-2 px-3 py-1 text-xs sm:text-sm font-bold rounded-full transition-all flex items-center gap-1.5 shadow-md ${
              isMyTurn
                ? 'bg-amber-400 hover:bg-amber-300 text-neutral-900 ring-2 ring-white scale-105 animate-bounce'
                : 'bg-neutral-800/80 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isMyTurn ? 'اسحب بطاقة' : 'كومة السحب'}</span>
            <span className="text-[11px] opacity-75">({drawPileCount})</span>
          </button>
        </div>

        {/* Discard Pile */}
        <div className="relative flex flex-col items-center">
          <div className="relative">
            {topCard ? (
              <CardView
                card={topCard}
                isFaceUp={true}
                size="md"
                theme={theme}
                className="shadow-2xl"
              />
            ) : (
              <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center text-white/50 text-xs">
                فارغ
              </div>
            )}
          </div>

          {/* Active color badge */}
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-neutral-300">اللون النشط:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm uppercase ${colorBadgeBg}`}
            >
              {colorLabelsAr[activeColor]}
            </span>
          </div>
        </div>
      </div>

      {/* Stacked Draw Penalty Alert */}
      {stackedDrawCount > 0 && (
        <div className="relative z-20 mt-3 px-4 py-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-black text-xs sm:text-sm rounded-full shadow-lg border border-yellow-300 animate-pulse flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-200" />
          <span>تراكم سحب العقوبة: +{stackedDrawCount} بطاقة!</span>
        </div>
      )}
    </div>
  );
};
