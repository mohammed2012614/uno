import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './config';
import { UserStats } from '../types/uno';

interface AuthContextType {
  user: User | null;
  userStats: UserStats | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  awardMatchStats: (won: boolean, unoCallsCount: number) => Promise<void>;
  refreshStats: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userStats: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  awardMatchStats: async () => {},
  refreshStats: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user profile from Firestore
  const loadUserStats = async (currentUser: User) => {
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
      // Fallback
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserStats(currentUser);
      } else {
        setUserStats(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await loadUserStats(result.user);
      }
    } catch (error) {
      console.error('Google Sign-In failed', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setUserStats(null);
    } catch (error) {
      console.error('Sign-Out failed', error);
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

    const docPath = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...updated,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  };

  const refreshStats = async () => {
    if (user) {
      await loadUserStats(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userStats,
        loading,
        signInWithGoogle,
        signOut,
        awardMatchStats,
        refreshStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
