import React from 'react';
import { UnoColor } from '../types/uno';
import { Sparkles } from 'lucide-react';

interface ColorPickerModalProps {
  isOpen: boolean;
  onSelectColor: (color: UnoColor) => void;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onSelectColor,
}) => {
  if (!isOpen) return null;

  const colorChoices: { color: UnoColor; labelAr: string; labelEn: string; bgClass: string; hoverClass: string }[] = [
    { color: 'red', labelAr: 'أحمر', labelEn: 'Red', bgClass: 'bg-red-500', hoverClass: 'hover:bg-red-400' },
    { color: 'blue', labelAr: 'أزرق', labelEn: 'Blue', bgClass: 'bg-blue-600', hoverClass: 'hover:bg-blue-500' },
    { color: 'yellow', labelAr: 'أصفر', labelEn: 'Yellow', bgClass: 'bg-amber-400 text-neutral-900', hoverClass: 'hover:bg-amber-300' },
    { color: 'green', labelAr: 'أخضر', labelEn: 'Green', bgClass: 'bg-emerald-500', hoverClass: 'hover:bg-emerald-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-neutral-900 border-2 border-amber-400/80 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-center gap-2 mb-2 text-amber-400">
          <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
          <h3 className="text-xl font-black">اختر اللون الجديد</h3>
        </div>
        <p className="text-neutral-400 text-xs sm:text-sm mb-6">
          لقد لعبت بطاقة التغيير! حدد اللون الذي يجب على اللاعب التالي اتباعه:
        </p>

        {/* 4 Color Quadrants */}
        <div className="grid grid-cols-2 gap-3.5 max-w-[260px] mx-auto">
          {colorChoices.map(({ color, labelAr, bgClass, hoverClass }) => (
            <button
              key={color}
              type="button"
              onClick={() => onSelectColor(color)}
              className={`h-24 rounded-2xl flex flex-col items-center justify-center font-black text-lg transition-all duration-200 shadow-lg transform active:scale-95 hover:scale-105 border-2 border-white/30 text-white ${bgClass} ${hoverClass}`}
            >
              <div className="w-6 h-6 rounded-full bg-white/30 mb-1 border border-white/50" />
              <span>{labelAr}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
