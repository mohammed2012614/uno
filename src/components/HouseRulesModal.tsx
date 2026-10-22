import React from 'react';
import { HouseRules, DEFAULT_HOUSE_RULES } from '../types/uno';
import { Sliders, X, Check, Zap, Layers, RefreshCw, AlertTriangle } from 'lucide-react';

interface HouseRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: HouseRules;
  onChangeRules: (rules: HouseRules) => void;
}

export const HouseRulesModal: React.FC<HouseRulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  onChangeRules,
}) => {
  if (!isOpen) return null;

  const toggleRule = (key: keyof HouseRules) => {
    onChangeRules({
      ...rules,
      [key]: !rules[key],
    });
  };

  const setPreset = (preset: 'classic' | 'stacking' | 'chaos') => {
    if (preset === 'classic') {
      onChangeRules({
        stackDrawTwo: false,
        stackDrawFour: false,
        sevenZeroRule: false,
        jumpInRule: false,
        drawToMatch: false,
        forcePlay: true,
        unoCallPenalty: true,
      });
    } else if (preset === 'stacking') {
      onChangeRules({
        stackDrawTwo: true,
        stackDrawFour: true,
        sevenZeroRule: false,
        jumpInRule: true,
        drawToMatch: true,
        forcePlay: true,
        unoCallPenalty: true,
      });
    } else if (preset === 'chaos') {
      onChangeRules({
        stackDrawTwo: true,
        stackDrawFour: true,
        sevenZeroRule: true,
        jumpInRule: true,
        drawToMatch: true,
        forcePlay: true,
        unoCallPenalty: true,
      });
    }
  };

  const ruleOptions: {
    key: keyof HouseRules;
    titleAr: string;
    descAr: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'stackDrawTwo',
      titleAr: 'تراكم سحب بطاقتين (+2)',
      descAr: 'الرد على بطاقة +2 ببطاقة +2 أخرى وتمرير مجموع السحب للخصم التالي.',
      icon: <Layers className="w-5 h-5 text-amber-400" />,
    },
    {
      key: 'stackDrawFour',
      titleAr: 'تراكم سحب 4 بطاقات (+4)',
      descAr: 'الرد على بطاقة +4 ببطاقة +4 لتراكم العقوبة (+8، +12...).',
      icon: <Zap className="w-5 h-5 text-rose-400" />,
    },
    {
      key: 'sevenZeroRule',
      titleAr: 'قاعدة 7 و 0 (تبديل الأيدي)',
      descAr: 'لعب الرقم 7 يتيح لك تبديل يدك مع أي لاعب تختاره، ولعب 0 يدير جميع الأيدي باتجاه اللعب!',
      icon: <RefreshCw className="w-5 h-5 text-cyan-400" />,
    },
    {
      key: 'jumpInRule',
      titleAr: 'القفز السريع (Jump-In)',
      descAr: 'إذا كانت لديك بطاقة مطابقة تماماً (اللون والرقم) يمكنك لعبها فوراً حتى لو لم يكن دورك!',
      icon: <Zap className="w-5 h-5 text-emerald-400" />,
    },
    {
      key: 'drawToMatch',
      titleAr: 'السحب حتى إيجاد بطاقة',
      descAr: 'إذا لم تكن لديك بطاقة صالحة، استمر في السحب حتى تجد بطاقة يمكن لعبها.',
      icon: <Layers className="w-5 h-5 text-blue-400" />,
    },
    {
      key: 'forcePlay',
      titleAr: 'اللعب الإجباري للبطاقة المسحوبة',
      descAr: 'إذا سحبت بطاقة صالحة للعب، يجب لعبها فوراً دون الاحتفاظ بها في اليد.',
      icon: <Check className="w-5 h-5 text-purple-400" />,
    },
    {
      key: 'unoCallPenalty',
      titleAr: 'عقوبة نسيان الأونو (+2)',
      descAr: 'إذا بقيت لديك بطاقة واحدة ولم تعلن "أونو!" وقام خصم بفضحك، تُعاقب بسحب بطاقتين.',
      icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">تخصيص قواعد اللعبة (House Rules)</h3>
              <p className="text-xs text-neutral-400">اختر القواعد المفضلة أو استخدم أحد الإعدادات الجاهزة</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="p-4 bg-neutral-950/40 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-neutral-400 shrink-0">إعدادات سريعة:</span>
          <button
            type="button"
            onClick={() => setPreset('classic')}
            className="px-3 py-1 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-full transition-colors border border-neutral-700 shrink-0"
          >
            الكلاسيكي الرسمي
          </button>
          <button
            type="button"
            onClick={() => setPreset('stacking')}
            className="px-3 py-1 text-xs font-bold bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-full transition-colors border border-amber-500/50 shrink-0"
          >
            حرب التراكم (+2 و +4)
          </button>
          <button
            type="button"
            onClick={() => setPreset('chaos')}
            className="px-3 py-1 text-xs font-bold bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded-full transition-colors border border-rose-500/50 shrink-0"
          >
            الفوضى الشاملة (7-0)
          </button>
        </div>

        {/* Rules List */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1 divide-y divide-neutral-800/60">
          {ruleOptions.map(({ key, titleAr, descAr, icon }) => (
            <label
              key={key}
              className="pt-3.5 first:pt-0 flex items-start justify-between gap-4 cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-neutral-800 group-hover:bg-neutral-700/80 transition-colors shrink-0 mt-0.5">
                  {icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-100 group-hover:text-amber-300 transition-colors">
                    {titleAr}
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed mt-0.5">
                    {descAr}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <input
                type="checkbox"
                checked={rules[key]}
                onChange={() => toggleRule(key)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer mt-1 shrink-0"
              />
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onChangeRules(DEFAULT_HOUSE_RULES)}
            className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
          >
            إعادة للوضع الافتراضي
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm rounded-xl shadow-lg transition-transform active:scale-95"
          >
            تطبيق القواعد
          </button>
        </div>
      </div>
    </div>
  );
};
