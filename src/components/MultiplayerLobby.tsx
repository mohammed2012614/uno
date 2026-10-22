import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/authContext';
import { HouseRules, DEFAULT_HOUSE_RULES, RoomPlayerDoc, RoomMessageDoc } from '../types/uno';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import {
  Users,
  Copy,
  Check,
  Play,
  Plus,
  Crown,
  Bot,
  Send,
  Sparkles,
  ArrowRight,
  UserCheck,
  Clock,
  LogIn,
} from 'lucide-react';

interface MultiplayerLobbyProps {
  onStartGame: (roomId: string, isHost: boolean) => void;
  onBackToMenu: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  onStartGame,
  onBackToMenu,
}) => {
  const { user, signInWithGoogle } = useAuth();

  const [view, setView] = useState<'browse' | 'create' | 'in_lobby'>('browse');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [loading, setLoading] = useState(false);

  // In-lobby states
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [players, setPlayers] = useState<RoomPlayerDoc[]>([]);
  const [messages, setMessages] = useState<RoomMessageDoc[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Create room states
  const [roomTitle, setRoomTitle] = useState('غرفة أونو الأبطال');
  const [rules, setRules] = useState<HouseRules>(DEFAULT_HOUSE_RULES);

  // 1. Listen to active room changes
  useEffect(() => {
    if (!currentRoomId || !user) return;

    const roomRef = doc(db, 'rooms', currentRoomId);
    const unsubRoom = onSnapshot(
      roomRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setRoomData(data);
          // If status moved to playing, trigger game start for all clients!
          if (data.status === 'playing') {
            onStartGame(currentRoomId, data.hostId === user.uid);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `rooms/${currentRoomId}`)
    );

    // Listen to players subcollection
    const playersRef = collection(db, 'rooms', currentRoomId, 'players');
    const unsubPlayers = onSnapshot(
      playersRef,
      (snap) => {
        const list: RoomPlayerDoc[] = [];
        snap.forEach((d) => list.push(d.data() as RoomPlayerDoc));
        setPlayers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `rooms/${currentRoomId}/players`)
    );

    // Listen to chat
    const messagesRef = collection(db, 'rooms', currentRoomId, 'messages');
    const unsubMessages = onSnapshot(
      messagesRef,
      (snap) => {
        const msgs: RoomMessageDoc[] = [];
        snap.forEach((d) => msgs.push(d.data() as RoomMessageDoc));
        msgs.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
        setMessages(msgs.slice(-20));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `rooms/${currentRoomId}/messages`)
    );

    return () => {
      unsubRoom();
      unsubPlayers();
      unsubMessages();
    };
  }, [currentRoomId, user]);

  // Create Room handler
  const handleCreateRoom = async () => {
    if (!user) return;
    setLoading(true);

    const generatedCode = `UNO-${Math.floor(100 + Math.random() * 900)}`;
    const roomDocPath = `rooms/${generatedCode}`;

    try {
      const newRoom = {
        roomId: generatedCode,
        hostId: user.uid,
        hostName: user.displayName || 'المضيف',
        title: roomTitle.trim() || 'غرفة أونو',
        status: 'waiting',
        direction: 1,
        currentTurnIndex: 0,
        activePlayerId: user.uid,
        playerIds: [user.uid],
        topCard: null,
        activeColor: 'red',
        stackedDrawCount: 0,
        winnerId: null,
        editionTitle: 'النسخة الرسمية',
        rulesPreset: rules,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'rooms', generatedCode), newRoom);

      // Add Host as first player
      const hostPlayer: RoomPlayerDoc = {
        playerId: user.uid,
        roomId: generatedCode,
        name: user.displayName || 'المضيف',
        avatar: user.photoURL || '',
        isReady: true,
        cardCount: 7,
        hasCalledUno: false,
        isBot: false,
        joinedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'rooms', generatedCode, 'players', user.uid), hostPlayer);

      setCurrentRoomId(generatedCode);
      setView('in_lobby');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, roomDocPath);
    } finally {
      setLoading(false);
    }
  };

  // Join Room handler
  const handleJoinRoom = async () => {
    if (!user) return;
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setLoading(true);
    setJoinError('');

    try {
      const roomSnap = await getDoc(doc(db, 'rooms', cleanCode));
      if (!roomSnap.exists()) {
        setJoinError('عذراً، كود الغرفة غير موجود. يرجى التأكد من الرمز.');
        setLoading(false);
        return;
      }

      const rData = roomSnap.data();
      if (rData.status === 'playing') {
        setJoinError('هذه الغرفة بدأت اللعب بالفعل!');
        setLoading(false);
        return;
      }

      // Add player to room
      const playerDoc: RoomPlayerDoc = {
        playerId: user.uid,
        roomId: cleanCode,
        name: user.displayName || `لاعب ${Math.floor(Math.random() * 100)}`,
        avatar: user.photoURL || '',
        isReady: false,
        cardCount: 7,
        hasCalledUno: false,
        isBot: false,
        joinedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'rooms', cleanCode, 'players', user.uid), playerDoc);

      // Update room playerIds
      const updatedPlayerIds = Array.from(new Set([...(rData.playerIds || []), user.uid]));
      await updateDoc(doc(db, 'rooms', cleanCode), {
        playerIds: updatedPlayerIds,
        updatedAt: new Date().toISOString(),
      });

      setCurrentRoomId(cleanCode);
      setView('in_lobby');
    } catch (err) {
      console.error(err);
      setJoinError('تعذر الانضمام للغرفة.');
    } finally {
      setLoading(false);
    }
  };

  // Add Bot to empty seat
  const handleAddBot = async () => {
    if (!user || !currentRoomId || !roomData) return;
    if (players.length >= 4) return;

    const botNumber = players.filter((p) => p.isBot).length + 1;
    const botId = `bot_${Date.now()}`;
    const botPlayer: RoomPlayerDoc = {
      playerId: botId,
      roomId: currentRoomId,
      name: `البوت الذكي ${botNumber}`,
      avatar: '',
      isReady: true,
      cardCount: 7,
      hasCalledUno: false,
      isBot: true,
      joinedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'rooms', currentRoomId, 'players', botId), botPlayer);
      const updatedPlayerIds = [...(roomData.playerIds || []), botId];
      await updateDoc(doc(db, 'rooms', currentRoomId), {
        playerIds: updatedPlayerIds,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle ready status
  const toggleReady = async () => {
    if (!user || !currentRoomId) return;
    const me = players.find((p) => p.playerId === user.uid);
    if (!me) return;

    try {
      await updateDoc(doc(db, 'rooms', currentRoomId, 'players', user.uid), {
        isReady: !me.isReady,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Host launches game
  const handleLaunchGame = async () => {
    if (!user || !currentRoomId || !roomData) return;
    if (roomData.hostId !== user.uid) return;
    if (players.length < 2) return;

    try {
      await updateDoc(doc(db, 'rooms', currentRoomId), {
        status: 'playing',
        updatedAt: new Date().toISOString(),
      });
      onStartGame(currentRoomId, true);
    } catch (err) {
      console.error(err);
    }
  };

  // Send chat message
  const handleSendMessage = async (textToSend?: string) => {
    if (!user || !currentRoomId) return;
    const messageText = (textToSend || chatInput).trim();
    if (!messageText) return;

    try {
      const msgId = `msg_${Date.now()}`;
      await addDoc(collection(db, 'rooms', currentRoomId, 'messages'), {
        id: msgId,
        roomId: currentRoomId,
        senderId: user.uid,
        senderName: user.displayName || 'لاعب',
        text: messageText,
        createdAt: new Date().toISOString(),
      });
      if (!textToSend) setChatInput('');
    } catch (err) {
      console.error(err);
    }
  };

  const copyRoomCode = () => {
    if (!currentRoomId) return;
    navigator.clipboard.writeText(currentRoomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Auth Gate check
  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/10 border border-amber-400/30 rounded-2xl flex items-center justify-center text-amber-400">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">اللعب أونلاين ضد الأصدقاء</h2>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            سجل دخولك بحساب Google لإنشاء غرف متعددة اللاعبين أو الانضمام لأصدقائك برمز الغرفة.
          </p>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full py-3 bg-gradient-to-r from-red-600 via-amber-500 to-amber-600 hover:brightness-110 text-neutral-950 font-black rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            <span>تسجيل الدخول للمتابعة</span>
          </button>
        </div>
      </div>
    );
  }

  // View: In Lobby
  if (view === 'in_lobby' && currentRoomId) {
    const isHost = roomData?.hostId === user.uid;
    const canStart = isHost && players.length >= 2;

    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
        {/* Lobby Header */}
        <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-3xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Crown className="w-5 h-5" />
              <h2 className="text-xl font-black text-white">{roomData?.title || 'غرفة اللعب'}</h2>
            </div>
            <p className="text-xs text-neutral-400">
              المضيف: <span className="text-neutral-200 font-bold">{roomData?.hostName}</span>
            </p>
          </div>

          {/* Room Code Badge */}
          <div className="flex items-center gap-2 bg-neutral-950 px-4 py-2 rounded-2xl border border-amber-400/40 shadow-inner">
            <span className="text-xs text-neutral-400 font-bold">رمز الغرفة:</span>
            <span className="text-lg font-black tracking-widest text-amber-400">{currentRoomId}</span>
            <button
              type="button"
              onClick={copyRoomCode}
              className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-300 transition-colors"
              title="نسخ الرمز"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Players Seats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => {
            const player = players[idx];
            if (player) {
              const isPlayerHost = roomData?.hostId === player.playerId;
              const isMe = player.playerId === user.uid;
              return (
                <div
                  key={player.playerId}
                  className={`p-4 rounded-2xl border flex flex-col items-center text-center relative transition-all ${
                    player.isReady
                      ? 'bg-neutral-900 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'bg-neutral-900/60 border-neutral-800'
                  }`}
                >
                  {isPlayerHost && (
                    <div className="absolute top-2 right-2 text-amber-400" title="المضيف">
                      <Crown className="w-4 h-4" />
                    </div>
                  )}

                  <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center mb-2 shadow-md">
                    {player.avatar ? (
                      <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                    ) : player.isBot ? (
                      <Bot className="w-6 h-6 text-amber-400" />
                    ) : (
                      <Users className="w-6 h-6 text-cyan-400" />
                    )}
                  </div>

                  <span className="text-xs font-bold text-white max-w-[120px] truncate">
                    {player.name} {isMe && '(أنت)'}
                  </span>

                  <span
                    className={`mt-2 text-[10px] font-black px-2 py-0.5 rounded-full ${
                      player.isReady
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {player.isReady ? 'جاهز للعب ✓' : 'في الانتظار...'}
                  </span>
                </div>
              );
            }

            // Empty Seat
            return (
              <div
                key={`empty_${idx}`}
                className="p-4 rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 flex flex-col items-center justify-center text-center text-neutral-500 min-h-[140px]"
              >
                <span className="text-xs font-semibold mb-2">مقعد شاغر ({idx + 1}/4)</span>
                {isHost && (
                  <button
                    type="button"
                    onClick={handleAddBot}
                    className="text-xs px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold rounded-lg border border-neutral-700 flex items-center gap-1 transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>إضافة بوت</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Lobby Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleReady}
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-neutral-700"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>تغيير حالتي (جاهز)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isHost ? (
              <button
                type="button"
                disabled={!canStart}
                onClick={handleLaunchGame}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-neutral-950 font-black rounded-xl text-sm shadow-xl flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>بدء المباراة الآن ({players.length} لاعبين)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-400 font-bold bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/30">
                <Clock className="w-4 h-4 animate-spin" />
                <span>في انتظار بدء المضيف للعبة...</span>
              </div>
            )}
          </div>
        </div>

        {/* Room Chat & Quick Emojis */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs font-bold text-neutral-300">دردشة وتفاعلات الغرفة</span>
            {/* Quick emoji reactions */}
            <div className="flex items-center gap-1.5">
              {['🔥', '😎', '👑', '😈', '😱', '👏'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendMessage(emoji)}
                  className="hover:scale-125 transition-transform text-base p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Messages list */}
          <div className="h-32 overflow-y-auto space-y-2 pr-1 text-xs">
            {messages.length === 0 ? (
              <p className="text-neutral-500 text-center py-6">لا توجد رسائل بعد. ابدأ المحادثة أو أرسل تفاعلاً!</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex items-start gap-2">
                  <strong className="text-amber-400">{m.senderName}:</strong>
                  <span className="text-neutral-200">{m.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Chat input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اكتب رسالة لأصدقائك..."
              maxLength={100}
              className="flex-1 bg-neutral-950 border border-neutral-700 px-3 py-2 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="p-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // View: Browse & Join / Create
  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-gradient-to-br from-amber-500/20 to-red-500/20 rounded-2xl border border-amber-500/30 text-amber-400">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">اللعب الجماعي أونلاين</h2>
        <p className="text-xs sm:text-sm text-neutral-400">
          تحدَّ أصدقاءك في غرفة خاصة، أو أنشئ غرفتك الخاصة وشارك الرمز معهم
        </p>
      </div>

      {view === 'browse' ? (
        <div className="space-y-4">
          {/* Join with code box */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>الانضمام برمز الغرفة</span>
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="مثال: UNO-842"
                className="flex-1 uppercase font-mono tracking-wider bg-neutral-950 border border-neutral-700 px-4 py-3 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                disabled={loading || !roomCodeInput.trim()}
                onClick={handleJoinRoom}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-black rounded-xl text-sm shadow-md transition-transform active:scale-95 disabled:opacity-50"
              >
                {loading ? 'جارٍ الانضمام...' : 'انضمام'}
              </button>
            </div>

            {joinError && <p className="text-xs text-rose-400 font-semibold">{joinError}</p>}
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-neutral-800 w-full" />
            <span className="bg-neutral-950 px-4 text-xs font-bold text-neutral-500 uppercase">أو</span>
          </div>

          {/* Create room button */}
          <button
            type="button"
            onClick={() => setView('create')}
            className="w-full py-4 bg-gradient-to-r from-red-600 via-amber-500 to-amber-600 hover:brightness-110 text-neutral-950 font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>إنشاء غرفة جديدة وتخصيص القواعد</span>
          </button>
        </div>
      ) : (
        // Create Room form
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-base font-black text-white">إعدادات الغرفة الجديدة</h3>
            <button
              type="button"
              onClick={() => setView('browse')}
              className="text-xs text-neutral-400 hover:text-white"
            >
              رجوع
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 mb-1.5">اسم الغرفة:</label>
            <input
              type="text"
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              placeholder="مثال: غرفة أونو الأساطير"
              maxLength={40}
              className="w-full bg-neutral-950 border border-neutral-700 px-4 py-2.5 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Quick Rules Toggles */}
          <div className="space-y-2 border-t border-neutral-800 pt-4">
            <span className="text-xs font-bold text-neutral-300">قواعد الغرفة:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.stackDrawTwo}
                  onChange={(e) => setRules({ ...rules, stackDrawTwo: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>تراكم +2</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.stackDrawFour}
                  onChange={(e) => setRules({ ...rules, stackDrawFour: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>تراكم +4</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.sevenZeroRule}
                  onChange={(e) => setRules({ ...rules, sevenZeroRule: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>قاعدة 7-0</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.jumpInRule}
                  onChange={(e) => setRules({ ...rules, jumpInRule: e.target.checked })}
                  className="accent-amber-500 rounded"
                />
                <span>القفز السريع</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleCreateRoom}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 font-black rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{loading ? 'جارٍ إنشاء الغرفة...' : 'إنشاء الغرفة والدخول للانتظار'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
