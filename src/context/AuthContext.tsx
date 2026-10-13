import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, testFirestoreConnection } from '../firebase';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  sendResetPassword,
} from '../services/authService';
import {
  loadCloudData,
  saveCloudData,
  mergeProgressMaps,
  hasProgressConflict,
} from '../services/cloudSaveService';
import {
  loadProgress,
  saveProgress,
  loadSettings,
  saveSettings,
  loadLastPlayedLevelId,
  saveLastPlayedLevelId,
} from '../utils/storage';
import { CloudUserData, GameSettings, ProgressMap, SyncStatus } from '../types/game';

interface MigrationModalData {
  isOpen: boolean;
  cloudData: CloudUserData;
  localProgress: ProgressMap;
  onChoice: (choice: 'merge' | 'local' | 'cloud') => void;
}

interface AuthContextType {
  user: User | null;
  authLoading: boolean;
  syncStatus: SyncStatus;
  migrationModal: MigrationModalData | null;
  saveToCloudOrLocal: (
    progress: ProgressMap,
    settings: GameSettings,
    lastPlayedId?: string
  ) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  forceCloudSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  onSyncApplied?: (newProgress: ProgressMap, newSettings: GameSettings) => void;
}> = ({ children, onSyncApplied }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved_local');
  const [migrationModal, setMigrationModal] = useState<MigrationModalData | null>(null);
  const cloudVersionRef = useRef<number>(1);
  const isOnlineRef = useRef<boolean>(navigator.onLine);

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      if (user) {
        setSyncStatus('saved_cloud');
      } else {
        setSyncStatus('saved_local');
      }
    };
    const handleOffline = () => {
      isOnlineRef.current = false;
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Handle migration conflict resolution
  const handleMigrationChoice = useCallback(
    async (
      choice: 'merge' | 'local' | 'cloud',
      cloudData: CloudUserData,
      localProg: ProgressMap,
      currentUser: User
    ) => {
      setSyncStatus('saving');
      setMigrationModal(null);

      const currentSettings = loadSettings();
      let finalProg: ProgressMap;
      let finalSettings: GameSettings = currentSettings;

      if (choice === 'merge') {
        finalProg = mergeProgressMaps(localProg, cloudData.progress);
        finalSettings = cloudData.settings || currentSettings;
      } else if (choice === 'local') {
        finalProg = localProg;
        finalSettings = currentSettings;
      } else {
        // 'cloud'
        finalProg = cloudData.progress;
        finalSettings = cloudData.settings || currentSettings;
      }

      // Persist locally
      saveProgress(finalProg);
      saveSettings(finalSettings);
      if (cloudData.lastPlayedLevelId && choice === 'cloud') {
        saveLastPlayedLevelId(cloudData.lastPlayedLevelId);
      }

      // Upload to Cloud
      try {
        const saved = await saveCloudData(
          currentUser.uid,
          finalProg,
          finalSettings,
          loadLastPlayedLevelId() || undefined,
          { email: currentUser.email, displayName: currentUser.displayName },
          cloudData.version || 1
        );
        cloudVersionRef.current = saved.version;
        setSyncStatus('saved_cloud');
      } catch (err) {
        console.error('Failed to sync resolved migration to cloud:', err);
        setSyncStatus('error');
      }

      // Notify App to update state
      if (onSyncApplied) {
        onSyncApplied(finalProg, finalSettings);
      }
    },
    [onSyncApplied]
  );

  // Check and process user login state
  const handleUserLogin = useCallback(
    async (loggedInUser: User) => {
      setSyncStatus('saving');
      const localProg = loadProgress();
      const localSettings = loadSettings();
      const localLastPlayed = loadLastPlayedLevelId();

      try {
        const cloudData = await loadCloudData(loggedInUser.uid);

        if (!cloudData) {
          // Case 1: First time sign-in for this account. Upload local guest progress to cloud!
          const saved = await saveCloudData(
            loggedInUser.uid,
            localProg,
            localSettings,
            localLastPlayed || undefined,
            { email: loggedInUser.email, displayName: loggedInUser.displayName },
            1
          );
          cloudVersionRef.current = saved.version;
          setSyncStatus('saved_cloud');
        } else {
          cloudVersionRef.current = cloudData.version;

          // Case 2: Cloud save exists. Check for conflicts with guest progress.
          const hasConflict = hasProgressConflict(localProg, cloudData.progress);

          if (hasConflict) {
            // Present migration dialog to user
            setMigrationModal({
              isOpen: true,
              cloudData,
              localProgress: localProg,
              onChoice: (choice) =>
                handleMigrationChoice(choice, cloudData, localProg, loggedInUser),
            });
            setSyncStatus('saved_cloud');
          } else {
            // No conflict:
            // If local is empty or cloud is superior, sync cloud to local
            const merged = mergeProgressMaps(localProg, cloudData.progress);
            saveProgress(merged);
            if (cloudData.settings) {
              saveSettings(cloudData.settings);
            }
            if (cloudData.lastPlayedLevelId) {
              saveLastPlayedLevelId(cloudData.lastPlayedLevelId);
            }

            // Sync updated back if merged had local additions
            const saved = await saveCloudData(
              loggedInUser.uid,
              merged,
              cloudData.settings || localSettings,
              cloudData.lastPlayedLevelId || localLastPlayed || undefined,
              { email: loggedInUser.email, displayName: loggedInUser.displayName },
              cloudData.version
            );
            cloudVersionRef.current = saved.version;
            setSyncStatus('saved_cloud');

            if (onSyncApplied) {
              onSyncApplied(merged, cloudData.settings || localSettings);
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync on login:', err);
        setSyncStatus('error');
      }
    },
    [handleMigrationChoice, onSyncApplied]
  );

  // Listen to auth state changes
  useEffect(() => {
    // Initial connection test
    testFirestoreConnection().catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await handleUserLogin(firebaseUser);
      } else {
        setSyncStatus('saved_local');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [handleUserLogin]);

  // Unified save function called on level complete or settings update
  const saveToCloudOrLocal = useCallback(
    async (
      newProgress: ProgressMap,
      newSettings: GameSettings,
      lastPlayedId?: string
    ) => {
      // 1. Always save to LocalStorage first (instant, works offline, safe for guests)
      saveProgress(newProgress);
      saveSettings(newSettings);
      if (lastPlayedId) {
        saveLastPlayedLevelId(lastPlayedId);
      }

      // 2. If guest, mark as saved locally
      if (!user) {
        setSyncStatus('saved_local');
        return;
      }

      // 3. If authenticated, save to Firestore
      if (!navigator.onLine) {
        setSyncStatus('offline');
        return;
      }

      setSyncStatus('saving');
      try {
        const saved = await saveCloudData(
          user.uid,
          newProgress,
          newSettings,
          lastPlayedId,
          { email: user.email, displayName: user.displayName },
          cloudVersionRef.current
        );
        cloudVersionRef.current = saved.version;
        setSyncStatus('saved_cloud');
      } catch (err) {
        console.error('Cloud save failed:', err);
        setSyncStatus('error');
      }
    },
    [user]
  );

  // Manual cloud sync trigger
  const forceCloudSync = useCallback(async () => {
    if (!user) return;
    setSyncStatus('saving');
    try {
      const currentProg = loadProgress();
      const currentSettings = loadSettings();
      const lastId = loadLastPlayedLevelId();

      const saved = await saveCloudData(
        user.uid,
        currentProg,
        currentSettings,
        lastId || undefined,
        { email: user.email, displayName: user.displayName },
        cloudVersionRef.current
      );
      cloudVersionRef.current = saved.version;
      setSyncStatus('saved_cloud');
    } catch (err) {
      console.error('Force sync error:', err);
      setSyncStatus('error');
    }
  }, [user]);

  // Auth Operations
  const signInGoogle = async () => {
    await loginWithGoogle();
  };

  const signInEmail = async (email: string, pass: string) => {
    await loginWithEmail(email, pass);
  };

  const signUpEmail = async (email: string, pass: string, name?: string) => {
    await registerWithEmail(email, pass, name);
  };

  const resetPassword = async (email: string) => {
    await sendResetPassword(email);
  };

  const signOut = async () => {
    await logoutUser();
    setUser(null);
    setSyncStatus('saved_local');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        syncStatus,
        migrationModal,
        saveToCloudOrLocal,
        signInGoogle,
        signInEmail,
        signUpEmail,
        resetPassword,
        signOut,
        forceCloudSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
