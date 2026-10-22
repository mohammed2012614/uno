import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { CustomEdition, ThemeId, HouseRules, DEFAULT_HOUSE_RULES } from '../types/uno';
import { THEMES } from '../utils/deck';
import { CardView } from './CardView';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import {
  Sparkles,
  Lock,
  Plus,
  Trash2,
  Play,
  Save,
  Palette,
  Shield,
  Layers,
  CheckCircle,
  LogIn,
} from 'lucide-react';

interface CustomEditionBuilderProps {
  onPlayEdition: (edition: CustomEdition) => void;
  activeEditionId?: string;
}

export const CustomEditionBuilder: React.FC<CustomEditionBuilderProps> = ({
  onPlayEdition,
  activeEditionId,
}) => {
  const { user, authError, signInWithGoogle, continueAsGuest } = useAuth();
  const [editions, setEditions] = useState<CustomEdition[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states for creating a new custom edition
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('neon');
  const [customWildName, setCustomWildName] = useState('درع الحماية');
  const [rules, setRules] = useState<HouseRules>({
    ...DEFAULT_HOUSE_RULES,
    stackDrawTwo: true,
    stackDrawFour: true,
  });

  // Listen to user's saved editions in Firestore or LocalStorage
  useEffect(() => {
    if (!user) {
      setEditions([]);
      return;
    }

    // If user is guest/anonymous, use localStorage
    if (!('emailVerified' in user)) {
      const savedLocal = localStorage.getItem(`uno_editions_${user.uid}`);
      if (savedLocal) {
        try {
          setEditions(JSON.parse(savedLocal));
        } catch {
          setEditions([]);
        }
      }
      return;
    }

    const path = `users/${user.uid}/editions`;
    const colRef = collection(db, 'users', user.uid, 'editions');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const loaded: CustomEdition[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          loaded.push({
            id: docSnap.id,
            ownerId: d.ownerId || user.uid,
            title: d.title || 'نسخة خاصة',
            description: d.description || '',
            theme: d.theme || 'classic',
            cardBackDesign: d.cardBackDesign || 'classic',
            rules: d.rules || DEFAULT_HOUSE_RULES,
            customWildName: d.customWildName || '',
            createdAt: d.createdAt || new Date().toISOString(),
            updatedAt: d.updatedAt || new Date().toISOString(),
          });
        });
        setEditions(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSaveEdition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) return;

    setSaving(true);
    const editionId = `ed_${Date.now()}`;
    const newEdition: CustomEdition = {
      id: editionId,
      ownerId: user.uid,
      title: title.trim(),
      description: description.trim(),
      theme: selectedTheme,
      cardBackDesign: 'custom',
      rules,
      customWildName: customWildName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!('emailVerified' in user)) {
      // Guest mode: save locally
      const updated = [newEdition, ...editions];
      setEditions(updated);
      localStorage.setItem(`uno_editions_${user.uid}`, JSON.stringify(updated));
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setSaving(false);
      return;
    }

    const docPath = `users/${user.uid}/editions/${editionId}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'editions', editionId), newEdition);
      setIsCreating(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEdition = async (editionId: string) => {
    if (!user) return;
    if (!('emailVerified' in user)) {
      const updated = editions.filter((e) => e.id !== editionId);
      setEditions(updated);
      localStorage.setItem(`uno_editions_${user.uid}`, JSON.stringify(updated));
      return;
    }
    const docPath = `users/${user.uid}/editions/${editionId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'editions', editionId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  };

  // If not signed in: show authentication required gate
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-amber-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/10 border border-amber-400/40 rounded-2xl flex items-center justify-center text-amber-400 shadow-lg">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            ميزة صنع النسخ الخاصة مقفلة
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto mb-6">
            يتطلب صنع النسخ المخصصة من بطاقات وقواعد أونو تسجيل الدخول بحساب
            <span className="text-amber-400 font-bold"> Google </span>
            لحفظ بطاقاتك الخاصة، إحصائياتك وتقدمك تلقائياً!
          </p>

          {authError && (
            <div className="mb-6 p-3 bg-neutral-800/80 border border-amber-500/40 rounded-2xl text-xs text-amber-300 max-w-md mx-auto">
              {authError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-red-600 via-amber-500 to-amber-600 hover:brightness-110 text-neutral-950 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <LogIn className="w-5 h-5" />
              <span>تسجيل الدخول بحساب Google</span>
            </button>

            <button
              type="button"
              onClick={() => continueAsGuest()}
              className="w-full sm:w-auto px-6 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-2xl border border-neutral-700 transition-all text-xs sm:text-sm"
            >
              المتابعة كلاعب مميز (تجربة فورية)
            </button>
          </div>

          {/* Feature Perks */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-start border-t border-neutral-800/80 pt-6">
            <div className="p-3 bg-neutral-800/40 rounded-xl border border-neutral-800">
              <Palette className="w-5 h-5 text-amber-400 mb-1.5" />
              <h4 className="text-xs font-bold text-white">ثيمات وبطاقات خاصة</h4>
              <p className="text-[11px] text-neutral-400">تخصيص ألوان البطاقات وخلفياتها وقدرات الـ Wild</p>
            </div>
            <div className="p-3 bg-neutral-800/40 rounded-xl border border-neutral-800">
              <Layers className="w-5 h-5 text-cyan-400 mb-1.5" />
              <h4 className="text-xs font-bold text-white">قواعد البيت المخصصة</h4>
              <p className="text-[11px] text-neutral-400">حفظ إعدادات التراكم وقواعد 7-0 والقفز السريع</p>
            </div>
            <div className="p-3 bg-neutral-800/40 rounded-xl border border-neutral-800">
              <Shield className="w-5 h-5 text-emerald-400 mb-1.5" />
              <h4 className="text-xs font-bold text-white">حفظ التقدم السحابي</h4>
              <p className="text-[11px] text-neutral-400">مزامنة إحصائيات الفوز والمستوى عبر أي جهاز</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900/80 border border-neutral-800 p-5 rounded-3xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-xl sm:text-2xl font-black text-white">استوديو النسخ الخاصة (Custom Editions)</h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400">
            اصنع مجموعاتك الخاصة من بطاقات أونو مع ثيمات فريدة وقواعد حصرية والعب بها مباشرة
          </p>
        </div>

        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-xl flex items-center gap-2 shadow-lg transition-all transform active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>إنشاء نسخة جديدة</span>
          </button>
        )}
      </div>

      {/* Create Form */}
      {isCreating && (
        <form
          onSubmit={handleSaveEdition}
          className="bg-neutral-900 border border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-6 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-400" />
              <span>مواصفات النسخة الخاصة</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              إلغاء
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inputs Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  اسم النسخة:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: أونو السايبربانك الخارقة"
                  maxLength={50}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  الوصف أو الشعار:
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: نسخة سريعة مع بطاقات تراكم مضاعفة"
                  maxLength={120}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Theme Picker */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  المظهر البصري (Theme):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(THEMES) as ThemeId[]).map((themeKey) => {
                    const t = THEMES[themeKey];
                    const isSelected = selectedTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setSelectedTheme(themeKey)}
                        className={`p-2 rounded-xl text-start border transition-all text-xs font-bold ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/10 text-amber-300 shadow-md ring-2 ring-amber-400/40'
                            : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div className="flex gap-1 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.colors.red }} />
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.colors.blue }} />
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.colors.yellow }} />
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.colors.green }} />
                        </div>
                        <span>{t.nameAr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Wild Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  اسم بطاقة الـ Wild الخاصة:
                </label>
                <input
                  type="text"
                  value={customWildName}
                  onChange={(e) => setCustomWildName(e.target.value)}
                  placeholder="مثال: درع الحماية، عاصفة الألوان"
                  maxLength={25}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Live Preview Column */}
            <div className="flex flex-col items-center justify-center p-6 bg-neutral-950 rounded-2xl border border-neutral-800">
              <span className="text-xs font-bold text-neutral-400 mb-4">معاينة حية للبطاقات في هذه النسخة:</span>
              <div className="flex items-center -space-x-4 rtl:space-x-reverse">
                <CardView
                  card={{ id: 'prev_1', color: 'red', value: '7' }}
                  size="md"
                  theme={THEMES[selectedTheme]}
                />
                <CardView
                  card={{ id: 'prev_2', color: 'blue', value: 'skip' }}
                  size="md"
                  theme={THEMES[selectedTheme]}
                />
                <CardView
                  card={{ id: 'prev_3', color: 'wild', value: 'wild_custom', customName: customWildName }}
                  size="md"
                  theme={THEMES[selectedTheme]}
                  className="z-10 shadow-2xl"
                />
                <CardView
                  card={{ id: 'prev_4', color: 'yellow', value: 'draw2' }}
                  size="md"
                  theme={THEMES[selectedTheme]}
                />
              </div>
              <span className="mt-4 text-[11px] text-amber-400/90 font-semibold">
                المظهر: {THEMES[selectedTheme].nameAr}
              </span>
            </div>
          </div>

          {/* House Rules Toggles */}
          <div className="border-t border-neutral-800 pt-4">
            <h4 className="text-xs font-bold text-neutral-300 mb-3">القواعد المدمجة مع هذه النسخة:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.stackDrawTwo}
                  onChange={(e) => setRules({ ...rules, stackDrawTwo: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>تراكم سحب بطاقتين (+2 على +2)</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.stackDrawFour}
                  onChange={(e) => setRules({ ...rules, stackDrawFour: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>تراكم سحب 4 بطاقات (+4 على +4)</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.sevenZeroRule}
                  onChange={(e) => setRules({ ...rules, sevenZeroRule: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>قاعدة 7 و 0 (تبديل وتدوير الأيدي)</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.jumpInRule}
                  onChange={(e) => setRules({ ...rules, jumpInRule: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>القفز السريع (Jump-In للبطاقات المتطابقة)</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-black rounded-xl text-sm shadow-lg flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جارٍ الحفظ...' : 'حفظ النسخة في حسابك'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Saved Editions Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-neutral-200 flex items-center gap-2">
          <span>نسخك المحفوظة ({editions.length})</span>
        </h3>

        {editions.length === 0 ? (
          <div className="p-8 text-center bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-800 text-neutral-400">
            <Palette className="w-10 h-10 mx-auto mb-2 text-neutral-600" />
            <p className="text-sm font-semibold mb-1">لم تقم بإنشاء نسخ خاصة حتى الآن</p>
            <p className="text-xs text-neutral-500">
              اضغط على "إنشاء نسخة جديدة" أعلاه لابتكار مجموعة مخصصة بالكامل!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editions.map((ed) => {
              const theme = THEMES[ed.theme] || THEMES.classic;
              const isActive = activeEditionId === ed.id;

              return (
                <div
                  key={ed.id}
                  className={`p-5 rounded-2xl bg-neutral-900 border transition-all flex flex-col justify-between gap-4 ${
                    isActive
                      ? 'border-amber-400 ring-2 ring-amber-400/30 bg-neutral-900/90'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-white">{ed.title}</h4>
                        {isActive && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> النسخة النشطة
                          </span>
                        )}
                      </div>
                      {ed.description && (
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{ed.description}</p>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.red }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.blue }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.yellow }} />
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.green }} />
                    </div>
                  </div>

                  {/* Rules Pill Badges */}
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-medium">
                      المظهر: {theme.nameAr}
                    </span>
                    {ed.customWildName && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800 text-amber-300 font-medium">
                        بطاقة: {ed.customWildName}
                      </span>
                    )}
                    {ed.rules.stackDrawTwo && (
                      <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400">
                        تراكم +2
                      </span>
                    )}
                    {ed.rules.sevenZeroRule && (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300">
                        قاعدة 7-0
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                    <button
                      type="button"
                      onClick={() => handleDeleteEdition(ed.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                      title="حذف النسخة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onPlayEdition(ed)}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>العب بهذه النسخة الآن</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
