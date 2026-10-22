import React from 'react';
import { Flame, ShieldAlert } from 'lucide-react';

interface UnoCallButtonProps {
  playerCardCount: number;
  hasCalledUno: boolean;
  onCallUno: () => void;
  onCatchOpponentUno?: () => void;
  canCatchOpponent?: boolean;
}

export const UnoCallButton: React.FC<UnoCallButtonProps> = ({
  playerCardCount,
  hasCalledUno,
  onCallUno,
  onCatchOpponentUno,
  canCatchOpponent,
}) => {
  const isUrgent = playerCardCount === 1 || playerCardCount === 2;

  return (
    <div className="flex items-center gap-3">
      {/* Catch Opponent UNO button */}
      {canCatchOpponent && onCatchOpponentUno && (
        <button
          type="button"
          onClick={onCatchOpponentUno}
          className="relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-xs sm:text-sm shadow-xl border-2 border-yellow-300 animate-bounce hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5"
        >
          <ShieldAlert className="w-4 h-4 text-yellow-300" />
          <span>فضح الخصم! (+2)</span>
        </button>
      )}

      {/* Main UNO Call Button */}
      <button
        type="button"
        disabled={hasCalledUno}
        onClick={onCallUno}
        className={`relative px-5 sm:px-7 py-2.5 sm:py-3 rounded-2xl font-black text-base sm:text-lg transition-all duration-300 flex items-center gap-2 select-none shadow-2xl ${
          hasCalledUno
            ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-default opacity-60'
            : isUrgent
            ? 'bg-gradient-to-r from-amber-400 via-red-500 to-rose-600 text-white border-2 border-yellow-200 ring-4 ring-yellow-400/80 animate-pulse hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(244,63,94,0.7)]'
            : 'bg-gradient-to-r from-amber-500 to-red-600 text-white border border-yellow-300 hover:brightness-110 active:scale-95'
        }`}
      >
        <Flame
          className={`w-5 h-5 sm:w-6 sm:h-6 ${
            isUrgent && !hasCalledUno ? 'text-yellow-200 animate-bounce' : 'text-amber-300'
          }`}
        />
        <span className="tracking-wider">
          {hasCalledUno ? 'أونو مُعلنة! ✓' : 'أونو! (UNO)'}
        </span>
      </button>
    </div>
  );
};
