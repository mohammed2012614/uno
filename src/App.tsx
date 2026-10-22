import React, { useState } from 'react';
import { AuthProvider, useAuth } from './firebase/authContext';
import { GameTable } from './components/GameTable';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { CustomEditionBuilder } from './components/CustomEditionBuilder';
import { HouseRulesModal } from './components/HouseRulesModal';
import { StatsModal } from './components/StatsModal';
import {
  CustomEdition,
  BotDifficulty,
  HouseRules,
  DEFAULT_HOUSE_RULES,
} from './types/uno';
import { THEMES } from './utils/deck';
import { sounds } from './utils/audio';
import {
  Play,
  Bot,
  Users,
  Palette,
  Sliders,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  LogIn,
  Flame,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

function UnoAppContent() {
  const { user, userStats, signInWithGoogle } = useAuth();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'single' | 'multiplayer' | 'custom_editions' | 'stats'>('single');
  const [inActiveGame, setInActiveGame] = useState(false);

  // Single player game configuration
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [botCount, setBotCount] = useState<number>(3); // default 4 players total (user + 3 bots)
  const [selectedEdition, setSelectedEdition] = useState<CustomEdition | null>(null);

  // Rules & Stats Modals
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [houseRules, setHouseRules] = useState<HouseRules>(DEFAULT_HOUSE_RULES);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Audio mute state
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  const handleStartGame = () => {
    setInActiveGame(true);
  };

  const handlePlayCustomEdition = (edition: CustomEdition) => {
    setSelectedEdition(edition);
    setHouseRules(edition.rules);
    setInActiveGame(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black" dir="rtl">
      {/* Top Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => {
              setInActiveGame(false);
              setActiveTab('single');
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* Uno Quad-Card Logo Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <span className="text-amber-400 font-black text-sm tracking-tighter">UNO</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5 leading-none">
                <span>أونو أرينا</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                  ONLINE
                </span>
              </h1>
              <p className="text-[10px] text-neutral-400">العب أونلاين وضد البوتات وصمّم نسختك</p>
            </div>
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setIsMuted(sounds.toggleMute())}
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700/60"
              title={isMuted ? 'تشغيل المؤثرات الصوتية' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Rules Button */}
            <button
              type="button"
              onClick={() => setIsRulesModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700/60 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>تخصيص القواعد</span>
            </button>

            {/* Profile / Auth Button */}
            {user ? (
              <button
                type="button"
                onClick={() => setIsStatsModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-all"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xs font-bold text-amber-400">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <span>{user.displayName?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className="flex flex-col text-start">
                  <span className="text-xs font-bold text-white max-w-[80px] truncate">
                    {user.displayName || 'لاعب'}
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold leading-none">
                    المستوى {userStats?.level || 1}
                  </span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-4 py-2 bg-gradient-to-r from-red-600 via-amber-500 to-amber-600 hover:brightness-110 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>دخول بحساب Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {inActiveGame ? (
          // Active Gameplay Screen
          <GameTable
            edition={selectedEdition}
            botDifficulty={botDifficulty}
            botCount={botCount}
            onExitGame={() => setInActiveGame(false)}
          />
        ) : (
          // Navigation Tabs & Menus
          <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="flex items-center justify-center">
              <div className="flex items-center p-1.5 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-lg overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('single')}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all shrink-0 ${
                    activeTab === 'single'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>اللعب ضد البوتات</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('multiplayer')}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all shrink-0 ${
                    activeTab === 'multiplayer'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>اللعب أونلاين مع الأصدقاء</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('custom_editions')}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all shrink-0 ${
                    activeTab === 'custom_editions'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>صانع النسخ الخاصة</span>
                  {!user && <span className="text-[10px] bg-red-600/80 text-white px-1.5 rounded-full">VIP</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('stats')}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all shrink-0 ${
                    activeTab === 'stats'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>الإحصائيات والأوسمة</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Single Player (Play vs Bots) */}
            {activeTab === 'single' && (
              <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                {/* Hero Banner */}
                <div className="relative rounded-3xl bg-gradient-to-r from-red-950/80 via-neutral-900 to-amber-950/80 border border-neutral-800 p-6 sm:p-8 shadow-2xl overflow-hidden text-center sm:text-start">
                  <div className="relative z-10 max-w-md">
                    <span className="text-amber-400 text-xs font-black uppercase tracking-wider mb-2 inline-block">
                      تحدّي الذكاء الاصطناعي
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                      العب أونو الكلاسيكية ضد بوتات بمستويات ذكاء متعددة
                    </h2>
                    <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed mb-6">
                      اختر صعوبة البوتات وعدد اللاعبين أو طبّق إحدى نسخك المخصصة وابدأ مباراة سريعة ومثيرة!
                    </p>

                    <button
                      type="button"
                      onClick={handleStartGame}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black rounded-2xl text-base shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-amber-500/20"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>بدء المباراة الآن</span>
                    </button>
                  </div>

                  {/* Decorative background cards */}
                  <div className="absolute left-6 -bottom-6 opacity-30 sm:opacity-75 pointer-events-none rotate-12 flex items-center -space-x-8">
                    <div className="w-24 h-36 rounded-xl bg-red-600 border-2 border-white shadow-2xl" />
                    <div className="w-24 h-36 rounded-xl bg-blue-600 border-2 border-white shadow-2xl -rotate-12" />
                    <div className="w-24 h-36 rounded-xl bg-amber-400 border-2 border-white shadow-2xl rotate-6" />
                  </div>
                </div>

                {/* Match Setup Options */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
                  {/* Difficulty selector */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">
                      مستوى ذكاء البوت:
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'easy', label: 'مبتدئ 🌱', desc: 'لعب مريح وممتع' },
                        { id: 'medium', label: 'متوسط ⚔️', desc: 'لعب تكتيكي متوازن' },
                        { id: 'hard', label: 'خبير ⚡', desc: 'قنص الأونو واستراتيجيات عميقة' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setBotDifficulty(d.id as BotDifficulty)}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            botDifficulty === d.id
                              ? 'border-amber-400 bg-amber-500/10 text-white ring-2 ring-amber-400/40 shadow-md'
                              : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-400'
                          }`}
                        >
                          <span className="block text-xs sm:text-sm font-black mb-0.5">{d.label}</span>
                          <span className="block text-[10px] text-neutral-500">{d.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number of players */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">
                      عدد اللاعبين في الطاولة:
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { count: 1, label: 'مبارزة ثنائية (1v1)', sub: 'أنت وبوت واحد' },
                        { count: 2, label: '3 لاعبين', sub: 'أنت وبوتان' },
                        { count: 3, label: 'طاولة كاملة (4 لاعبين)', sub: 'أنت و3 بوتات' },
                      ].map((item) => (
                        <button
                          key={item.count}
                          type="button"
                          onClick={() => setBotCount(item.count)}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            botCount === item.count
                              ? 'border-amber-400 bg-amber-500/10 text-white ring-2 ring-amber-400/40 shadow-md'
                              : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-400'
                          }`}
                        >
                          <span className="block text-xs sm:text-sm font-bold text-white mb-0.5">{item.label}</span>
                          <span className="block text-[10px] text-neutral-500">{item.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Rules quick toggle button */}
                  <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-200 block">قواعد اللعبة المطبقة:</span>
                      <span className="text-[11px] text-neutral-400">
                        {houseRules.stackDrawTwo ? 'تراكم +2 مفعل' : 'تراكم +2 معطل'} •{' '}
                        {houseRules.sevenZeroRule ? 'قاعدة 7-0 مفعلة' : 'قاعدة 7-0 معطلة'} •{' '}
                        {houseRules.jumpInRule ? 'القفز السريع مفعل' : 'القفز السريع معطل'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRulesModalOpen(true)}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-colors"
                    >
                      تعديل القواعد
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Multiplayer Online */}
            {activeTab === 'multiplayer' && (
              <MultiplayerLobby
                onStartGame={(roomId, isHost) => {
                  setInActiveGame(true);
                }}
                onBackToMenu={() => setActiveTab('single')}
              />
            )}

            {/* TAB 3: Custom Edition Builder */}
            {activeTab === 'custom_editions' && (
              <CustomEditionBuilder
                onPlayEdition={handlePlayCustomEdition}
                activeEditionId={selectedEdition?.id}
              />
            )}

            {/* TAB 4: Stats & Achievements */}
            {activeTab === 'stats' && (
              <div className="max-w-md mx-auto">
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-white">إحصائياتك وإنجازاتك</h3>
                  <p className="text-xs text-neutral-400">
                    يمكنك عرض جميع تفاصيل المستوى وسجل الانتصارات والأوسمة
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsStatsModalOpen(true)}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-black rounded-xl text-sm shadow-md"
                  >
                    عرض لوحة الإحصائيات والأوسمة
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* House Rules Modal */}
      <HouseRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        rules={houseRules}
        onChangeRules={(newRules) => setHouseRules(newRules)}
      />

      {/* Stats Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UnoAppContent />
    </AuthProvider>
  );
}
