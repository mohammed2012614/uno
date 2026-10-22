import React from 'react';
import { UnoCard, ThemeConfig } from '../types/uno';
import { THEMES } from '../utils/deck';
import { Ban, RotateCcw, Plus, Sparkles, Shield, Flame } from 'lucide-react';

interface CardViewProps {
  card: UnoCard;
  isFaceUp?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  theme?: ThemeConfig;
  className?: string;
  isHighlighted?: boolean;
  selected?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isFaceUp = true,
  isPlayable = false,
  onClick,
  size = 'md',
  theme = THEMES.classic,
  className = '',
  isHighlighted = false,
  selected = false,
}) => {
  // Dimensions
  const sizeClasses = {
    sm: 'w-14 h-20 text-xs rounded-lg',
    md: 'w-20 h-28 text-sm sm:w-24 sm:h-36 sm:text-base rounded-xl',
    lg: 'w-28 h-40 text-lg sm:w-32 sm:h-48 sm:text-xl rounded-2xl',
  }[size];

  // Colors based on theme
  const getCardBg = () => {
    if (!isFaceUp) {
      return 'bg-gradient-to-br from-red-800 via-red-600 to-amber-700 border-yellow-400';
    }
    switch (card.color) {
      case 'red':
        return 'bg-gradient-to-br from-rose-500 via-red-600 to-red-700 text-white';
      case 'blue':
        return 'bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-700 text-white';
      case 'green':
        return 'bg-gradient-to-br from-emerald-400 via-green-600 to-emerald-800 text-white';
      case 'yellow':
        return 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 text-neutral-900';
      case 'wild':
      default:
        return 'bg-gradient-to-br from-neutral-900 via-zinc-800 to-black text-white';
    }
  };

  // Card Content inside the center oval
  const renderCardContent = () => {
    switch (card.value) {
      case 'skip':
        return <Ban className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />;
      case 'reverse':
        return <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />;
      case 'draw2':
        return (
          <div className="flex items-center font-extrabold tracking-tighter">
            <Plus className="w-5 h-5 stroke-[3]" />
            <span className="text-2xl sm:text-3xl font-black">2</span>
          </div>
        );
      case 'wild':
        return (
          <div className="relative flex items-center justify-center">
            {/* 4-color segmented circle for Wild */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden grid grid-cols-2 shadow-inner border border-white/40 animate-pulse">
              <div className="bg-red-500" />
              <div className="bg-blue-500" />
              <div className="bg-yellow-400" />
              <div className="bg-green-500" />
            </div>
            <Sparkles className="absolute w-5 h-5 text-white drop-shadow" />
          </div>
        );
      case 'wild4':
        return (
          <div className="relative flex flex-col items-center justify-center font-black">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden grid grid-cols-2 shadow-inner border border-white/40">
              <div className="bg-red-500" />
              <div className="bg-blue-500" />
              <div className="bg-yellow-400" />
              <div className="bg-green-500" />
            </div>
            <span className="absolute text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              +4
            </span>
          </div>
        );
      case 'wild_custom':
        return (
          <div className="flex flex-col items-center text-center px-1">
            <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 animate-bounce" />
            <span className="text-[10px] sm:text-xs font-bold leading-tight line-clamp-2 text-amber-200">
              {card.customName || 'خاص'}
            </span>
          </div>
        );
      default:
        // Number card 0 - 9
        return (
          <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-md select-none font-sans">
            {card.value}
          </span>
        );
    }
  };

  // Mini badge for corners
  const renderCornerBadge = () => {
    switch (card.value) {
      case 'skip':
        return <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />;
      case 'reverse':
        return <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />;
      case 'draw2':
        return <span className="font-extrabold text-xs sm:text-sm">+2</span>;
      case 'wild':
        return <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />;
      case 'wild4':
        return <span className="font-extrabold text-xs sm:text-sm text-amber-300">+4</span>;
      case 'wild_custom':
        return <Shield className="w-3.5 h-3.5 text-amber-300" />;
      default:
        return <span className="font-bold text-xs sm:text-sm font-sans">{card.value}</span>;
    }
  };

  if (!isFaceUp) {
    // Card Back
    return (
      <div
        onClick={onClick}
        className={`relative ${sizeClasses} ${getCardBg()} shadow-xl border-2 sm:border-[3px] border-amber-300/80 flex items-center justify-center cursor-pointer select-none overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      >
        <div className="absolute inset-1 border border-white/20 rounded-lg flex items-center justify-center bg-black/20">
          <div className="transform -rotate-25 bg-amber-400 text-red-700 font-black px-2 py-0.5 rounded-full shadow-lg border border-white/80">
            <span className="text-xs sm:text-base font-extrabold tracking-wider">UNO</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={!isPlayable && !onClick}
      onClick={onClick}
      className={`relative ${sizeClasses} ${getCardBg()} shadow-xl border-2 sm:border-[3px] border-white/90 flex flex-col justify-between p-1 sm:p-2 cursor-pointer select-none overflow-hidden transition-all duration-200 ${
        isPlayable
          ? 'hover:-translate-y-3 sm:hover:-translate-y-4 hover:shadow-2xl hover:brightness-110 ring-2 sm:ring-4 ring-yellow-300/90'
          : onClick
          ? 'opacity-85 hover:opacity-100'
          : 'opacity-70 cursor-not-allowed'
      } ${isHighlighted ? 'ring-4 ring-cyan-400 scale-105' : ''} ${
        selected ? '-translate-y-4 ring-4 ring-emerald-400' : ''
      } ${className}`}
      style={{
        transform: card.rotation ? `rotate(${card.rotation}deg)` : undefined,
      }}
    >
      {/* Top Left Corner */}
      <div className="flex items-center justify-start drop-shadow">
        {renderCornerBadge()}
      </div>

      {/* Center Angled Oval with Card Value */}
      <div className="relative w-full aspect-[4/3] rounded-full bg-white/20 backdrop-blur-xs border border-white/40 flex items-center justify-center transform -rotate-15 shadow-inner self-center">
        <div className="transform rotate-15 flex items-center justify-center text-center">
          {renderCardContent()}
        </div>
      </div>

      {/* Bottom Right Corner (flipped) */}
      <div className="flex items-center justify-end transform rotate-180 drop-shadow">
        {renderCornerBadge()}
      </div>
    </button>
  );
};
