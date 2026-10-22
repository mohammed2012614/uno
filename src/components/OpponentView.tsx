import React from 'react';
import { Player } from '../types/uno';
import { Bot, User, ShieldAlert, Sparkles } from 'lucide-react';

interface OpponentViewProps {
  player: Player;
  isCurrentTurn: boolean;
  position: 'top' | 'left' | 'right';
  onCatchUno?: (player: Player) => void;
  canCatchUno?: boolean;
}

export const OpponentView: React.FC<OpponentViewProps> = ({
  player,
  isCurrentTurn,
  position,
  onCatchUno,
  canCatchUno,
}) => {
  const difficultyBadge = player.isBot && player.botDifficulty ? (
    <span
      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
        player.botDifficulty === 'hard'
          ? 'bg-rose-900/80 text-rose-300 border border-rose-500/50'
          : player.botDifficulty === 'medium'
          ? 'bg-amber-900/80 text-amber-300 border border-amber-500/50'
          : 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/50'
      }`}
    >
      {player.botDifficulty === 'hard' ? 'خبير ⚡' : player.botDifficulty === 'medium' ? 'متوسط ⚔️' : 'مبتدئ 🌱'}
    </span>
  ) : null;

  return (
    <div
      className={`relative flex items-center gap-2.5 p-2 rounded-2xl transition-all duration-300 ${
        isCurrentTurn
          ? 'bg-neutral-800/90 ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)] scale-105'
          : 'bg-neutral-900/70 border border-neutral-800'
      } ${position === 'top' ? 'flex-row' : 'flex-col'}`}
    >
      {/* Turn indicator glow tag */}
      {isCurrentTurn && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-neutral-950 font-black text-[10px] px-2 py-0.2 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-md">
          <Sparkles className="w-2.5 h-2.5" />
          <span>دوره الآن</span>
        </div>
      )}

      {/* Avatar */}
      <div className="relative">
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center overflow-hidden border-2 shadow-md ${
            isCurrentTurn ? 'border-yellow-400 bg-yellow-500/20' : 'border-neutral-700 bg-neutral-800'
          }`}
        >
          {player.avatar && player.avatar.startsWith('http') ? (
            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
          ) : player.isBot ? (
            <Bot className="w-6 h-6 text-amber-400" />
          ) : (
            <User className="w-6 h-6 text-cyan-400" />
          )}
        </div>

        {/* Card count mini badge */}
        <div className="absolute -bottom-1 -right-1 bg-red-600 border border-white text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
          {player.cards.length}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-start leading-tight">
        <div className="flex items-center gap-1">
          <span className="text-xs sm:text-sm font-bold text-neutral-100 max-w-[90px] truncate">
            {player.name}
          </span>
        </div>
        {difficultyBadge}

        {/* Uno Status */}
        {player.cards.length === 1 && (
          <div className="mt-1">
            {player.hasCalledUno ? (
              <span className="text-[10px] bg-emerald-500/20 border border-emerald-500 text-emerald-400 px-1.5 py-0.5 rounded-full font-black animate-pulse">
                أونو! 🔥
              </span>
            ) : canCatchUno && onCatchUno ? (
              <button
                type="button"
                onClick={() => onCatchUno(player)}
                className="text-[10px] bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded-full font-black animate-bounce flex items-center gap-1 shadow-md"
              >
                <ShieldAlert className="w-3 h-3" />
                <span>فضح الأونو! (+2)</span>
              </button>
            ) : (
              <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">
                بطاقة واحدة!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mini Card Fan representation */}
      <div className="flex items-center -space-x-4 rtl:space-x-reverse pointer-events-none opacity-80 scale-75 origin-center">
        {Array.from({ length: Math.min(player.cards.length, 5) }).map((_, i) => (
          <div
            key={i}
            className="w-5 h-8 rounded-sm bg-gradient-to-br from-red-700 to-amber-700 border border-amber-300 shadow-xs"
            style={{ transform: `rotate(${(i - 2) * 8}deg)` }}
          />
        ))}
        {player.cards.length > 5 && (
          <span className="text-[9px] font-bold text-neutral-400 pl-1">
            +{player.cards.length - 5}
          </span>
        )}
      </div>
    </div>
  );
};
