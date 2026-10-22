import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './config';
import { UserStats } from '../types/uno';

interface AuthContextType {
  user: User | { uid: string; displayName: string | null; photoURL: string | null; email?: string | null; isAnonymous?: boolean } | null;
  userStats: UserStats | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: (guestName?: string) => void;
  signOut: () => Promise<void>;
  awardMatchStats: (won: boolean, unoCallsCount: number) => Promise<void>;
  refreshStats: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userStats: null,
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  continueAsGuest: () => {},
  signOut: async () => {},
  awardMatchStats: async () => {},
  refreshStats: async () => {},
  clearAuthError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | { uid: string; displayName: string | null; photoURL: string | null; email?: string | null; isAnonymous?: boolean } | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync user profile from Firestore or local storage
  const loadUserStats = async (currentUser: { uid: string; displayName: string | null; photoURL: string | null; email?: string | null }) => {
    const userDocPath = `users/${currentUser.uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserStats({
          uid: currentUser.uid,
          displayName: data.displayName || currentUser.displayName || 'لاعب أونو',
          email: currentUser.email || undefined,
          photoURL: data.photoURL || currentUser.photoURL || undefined,
          xp: data.xp ?? 100,
          level: data.level ?? 1,
          wins: data.wins ?? 0,
          gamesPlayed: data.gamesPlayed ?? 0,
          unoCalls: data.unoCalls ?? 0,
          achievements: data.achievements || [],
        });
      } else {
        // Initial setup for new user
        const initialStats: UserStats = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'لاعب أونو',
          email: currentUser.email || undefined,
          photoURL: currentUser.photoURL || undefined,
          xp: 150,
          level: 1,
          wins: 0,
          gamesPlayed: 0,
          unoCalls: 0,
          achievements: ['uno_welcome'],
        };
        await setDoc(doc(db, 'users', currentUser.uid), {
          ...initialStats,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setUserStats(initialStats);
      }
    } catch (err) {
      console.warn('Could not fetch user stats, using local profile fallback', err);
      // Fallback local stats
      const savedLocal = localStorage.getItem(`uno_stats_${currentUser.uid}`);
      if (savedLocal) {
        try {
          setUserStats(JSON.parse(savedLocal));
          return;
        } catch {
          // ignore
        }
      }
      setUserStats({
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'لاعب أونو',
        email: currentUser.email || undefined,
        photoURL: currentUser.photoURL || undefined,
        xp: 100,
        level: 1,
        wins: 0,
        gamesPlayed: 0,
        unoCalls: 0,
        achievements: [],
      });
    }
  };

  useEffect(() => {
    // Check saved guest session first if no firebase auth
    const savedGuest = localStorage.getItem('uno_guest_session');

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserStats(currentUser);
      } else if (savedGuest) {
        try {
          const guestUser = JSON.parse(savedGuest);
          setUser(guestUser);
          await loadUserStats(guestUser);
        } catch {
          setUser(null);
          setUserStats(null);
        }
      } else {
        setUser(null);
        setUserStats(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        localStorage.removeItem('uno_guest_session');
        setUser(result.user);
        await loadUserStats(result.user);
      }
    } catch (error: unknown) {
      const fbError = error as { code?: string; message?: string };
      // Gracefully handle expected user/browser popup events without throwing fatal errors
      if (
        fbError?.code === 'auth/popup-closed-by-user' ||
        fbError?.code === 'auth/cancelled-popup-request'
      ) {
        // User closed the popup window - not an application bug
        setAuthError('تم إغلاق نافذة تسجيل الدخول. يمكنك المحاولة مجدداً أو المتابعة كضيف.');
        return;
      }

      if (fbError?.code === 'auth/popup-blocked') {
        setAuthError('المتصفح حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة أو الدخول كضيف.');
        return;
      }

      console.warn('Google Sign-In notice:', fbError?.message || error);
      setAuthError('تعذر تسجيل الدخول حالياً. يمكنك استخدام حساب الضيف المميز لتجربة كل الميزات.');
    }
  };

  const continueAsGuest = (guestName?: string) => {
    const guestId = `guest_${Math.floor(100000 + Math.random() * 900000)}`;
    const guestUser = {
      uid: guestId,
      displayName: guestName || `لاعب أونو #${guestId.slice(-4)}`,
      photoURL: null,
      email: null,
      isAnonymous: true,
    };
    localStorage.setItem('uno_guest_session', JSON.stringify(guestUser));
    setUser(guestUser);

    const initialStats: UserStats = {
      uid: guestId,
      displayName: guestUser.displayName,
      xp: 150,
      level: 1,
      wins: 0,
      gamesPlayed: 0,
      unoCalls: 0,
      achievements: ['uno_welcome'],
    };
    localStorage.setItem(`uno_stats_${guestId}`, JSON.stringify(initialStats));
    setUserStats(initialStats);
    setAuthError(null);
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('uno_guest_session');
      await fbSignOut(auth);
      setUser(null);
      setUserStats(null);
      setAuthError(null);
    } catch (error) {
      console.warn('Sign-Out notice:', error);
      setUser(null);
      setUserStats(null);
    }
  };

  const awardMatchStats = async (won: boolean, unoCallsCount: number) => {
    if (!user || !userStats) return;

    const gainedXp = (won ? 350 : 120) + unoCallsCount * 50;
    const newXp = userStats.xp + gainedXp;
    const newLevel = Math.floor(newXp / 500) + 1;
    const newWins = won ? userStats.wins + 1 : userStats.wins;
    const newGames = userStats.gamesPlayed + 1;
    const newUnoCalls = userStats.unoCalls + unoCallsCount;

    const achievements = [...userStats.achievements];
    if (newWins >= 1 && !achievements.includes('first_win')) achievements.push('first_win');
    if (newWins >= 10 && !achievements.includes('uno_master')) achievements.push('uno_master');
    if (newUnoCalls >= 10 && !achievements.includes('loud_shout')) achievements.push('loud_shout');

    const updated: UserStats = {
      ...userStats,
      xp: newXp,
      level: newLevel,
      wins: newWins,
      gamesPlayed: newGames,
      unoCalls: newUnoCalls,
      achievements,
    };

    setUserStats(updated);
    localStorage.setItem(`uno_stats_${user.uid}`, JSON.stringify(updated));

    // If real Firebase user, sync to Firestore
    if ('emailVerified' in user) {
      const docPath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          ...updated,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, docPath);
      }
    }
  };

  const refreshStats = async () => {
    if (user) {
      await loadUserStats(user);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userStats,
        loading,
        authError,
        signInWithGoogle,
        continueAsGuest,
        signOut,
        awardMatchStats,
        refreshStats,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
