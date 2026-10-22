import React from 'react';
import { useAuth } from '../firebase/authContext';
import { Trophy, Award, Star, Flame, X, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { user, userStats, signInWithGoogle, signOut } = useAuth();

  if (!isOpen) return null;

  const xp = userStats?.xp || 0;
  const level = userStats?.level || 1;
  const wins = userStats?.wins || 0;
  const gamesPlayed = userStats?.gamesPlayed || 0;
  const unoCalls = userStats?.unoCalls || 0;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

  // Next level threshold
  const currentLevelBase = (level - 1) * 500;
  const nextLevelXp = level * 500;
  const progressInLevel = Math.max(0, Math.min(100, Math.round(((xp - currentLevelBase) / 500) * 100)));

  const badgeDefinitions = [
    {
      id: 'first_win',
      nameAr: 'أول فوز 🏆',
      descAr: 'تحقيق الفوز في أول مباراة أونو',
      unlocked: wins >= 1,
    },
    {
      id: 'uno_master',
      nameAr: 'سيد الأونو 👑',
      descAr: 'تحقيق 10 انتصارات ساحقة',
      unlocked: wins >= 10,
    },
    {
      id: 'loud_shout',
      nameAr: 'صوت الرعد 🔥',
      descAr: 'إعلان "أونو!" 10 مرات بنجاح',
      unlocked: unoCalls >= 10,
    },
    {
      id: 'veteran',
      nameAr: 'محارب الطاولة ⚔️',
      descAr: 'خوض 15 مباراة أونو',
      unlocked: gamesPlayed >= 15,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">إحصائيات اللاعب والإنجازات</h3>
              <p className="text-xs text-neutral-400">سجل تقدمك والمكافآت المحققة</p>
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

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* User Profile Card */}
          <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 font-bold">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.displayName ? user.displayName.charAt(0) : 'U'}</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {user?.displayName || 'لاعب ضيف'}
                </h4>
                <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>المستوى {level}</span>
                </div>
              </div>
            </div>

            {user ? (
              <button
                type="button"
                onClick={signOut}
                className="p-2 text-neutral-400 hover:text-rose-400 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black rounded-lg transition-transform active:scale-95 flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>دخول</span>
              </button>
            )}
          </div>

          {/* Level Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-neutral-400">نقاط الخبرة (XP):</span>
              <span className="text-amber-400 font-mono">{xp} / {nextLevelXp} XP</span>
            </div>
            <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressInLevel}%` }}
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-xl font-black text-emerald-400">{wins}</span>
              <span className="block text-[11px] text-neutral-400 font-semibold mt-0.5">مرات الفوز</span>
            </div>
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-xl font-black text-cyan-400">{winRate}%</span>
              <span className="block text-[11px] text-neutral-400 font-semibold mt-0.5">نسبة الفوز</span>
            </div>
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-xl font-black text-rose-400">{unoCalls}</span>
              <span className="block text-[11px] text-neutral-400 font-semibold mt-0.5">إعلانات أونو</span>
            </div>
          </div>

          {/* Achievements / Badges */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>الأوسمة والإنجازات</span>
            </h5>
            <div className="space-y-1.5">
              {badgeDefinitions.map((b) => (
                <div
                  key={b.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    b.unlocked
                      ? 'bg-amber-500/10 border-amber-500/40 text-neutral-200'
                      : 'bg-neutral-950 border-neutral-800/80 text-neutral-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{b.nameAr}</span>
                    <span className="text-[10px] opacity-75">{b.descAr}</span>
                  </div>
                  {b.unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-[10px] font-bold opacity-50 shrink-0">مغلق</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
