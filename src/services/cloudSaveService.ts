import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CloudUserData, GameSettings, ProgressMap } from '../types/game';

const COLLECTION_NAME = 'users';

/**
 * Loads the user's cloud save from Firestore.
 */
export async function loadCloudData(userId: string): Promise<CloudUserData | null> {
  const docPath = `${COLLECTION_NAME}/${userId}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data() as Partial<CloudUserData>;
    return {
      userId,
      email: data.email || undefined,
      displayName: data.displayName || undefined,
      progress: data.progress || {},
      settings: data.settings as GameSettings,
      lastPlayedLevelId: data.lastPlayedLevelId || undefined,
      stats: data.stats || undefined,
      updatedAt: data.updatedAt || new Date().toISOString(),
      version: data.version || 1,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, docPath);
  }
}

/**
 * Saves or updates cloud progress in Firestore.
 */
export async function saveCloudData(
  userId: string,
  progress: ProgressMap,
  settings: GameSettings,
  lastPlayedLevelId?: string,
  userProfile?: { email?: string | null; displayName?: string | null },
  existingVersion: number = 1
): Promise<CloudUserData> {
  const docPath = `${COLLECTION_NAME}/${userId}`;
  const now = new Date().toISOString();

  const payload: CloudUserData = {
    userId,
    email: userProfile?.email || undefined,
    displayName: userProfile?.displayName || undefined,
    progress,
    settings,
    lastPlayedLevelId: lastPlayedLevelId || undefined,
    updatedAt: now,
    version: existingVersion + 1,
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    await setDoc(docRef, payload, { merge: true });
    return payload;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

/**
 * Merges local guest progress with cloud progress.
 * For each level, chooses the best performance (highest stars, lowest moves, fastest time).
 */
export function mergeProgressMaps(
  localProg: ProgressMap,
  cloudProg: ProgressMap
): ProgressMap {
  const merged: ProgressMap = { ...cloudProg };

  for (const [levelId, localItem] of Object.entries(localProg)) {
    const cloudItem = merged[levelId];
    if (!cloudItem) {
      merged[levelId] = { ...localItem };
    } else {
      merged[levelId] = {
        completed: localItem.completed || cloudItem.completed,
        stars: Math.max(localItem.stars || 0, cloudItem.stars || 0),
        bestMoves: Math.min(
          localItem.bestMoves || Infinity,
          cloudItem.bestMoves || Infinity
        ),
        bestTime: Math.min(
          localItem.bestTime || Infinity,
          cloudItem.bestTime || Infinity
        ),
      };
      // Sanitize infinities if any
      if (merged[levelId].bestMoves === Infinity) merged[levelId].bestMoves = localItem.bestMoves;
      if (merged[levelId].bestTime === Infinity) merged[levelId].bestTime = localItem.bestTime;
    }
  }

  return merged;
}

/**
 * Checks if local guest progress has meaningful data that differs from or adds to cloud progress.
 */
export function hasProgressConflict(
  localProg: ProgressMap,
  cloudProg: ProgressMap
): boolean {
  const localKeys = Object.keys(localProg);
  const cloudKeys = Object.keys(cloudProg);

  // If local is completely empty, no conflict
  if (localKeys.length === 0) return false;
  // If cloud is empty, can migrate directly without prompt
  if (cloudKeys.length === 0) return false;

  // If both have progress, check if there are differences
  for (const key of localKeys) {
    if (!cloudProg[key]) return true; // Local has a level cloud doesn't
    const l = localProg[key];
    const c = cloudProg[key];
    if (l.stars > c.stars || l.bestMoves < c.bestMoves || l.bestTime < c.bestTime) {
      return true;
    }
  }

  // Also if cloud has levels local doesn't
  for (const key of cloudKeys) {
    if (!localProg[key]) return true;
  }

  return false;
}
