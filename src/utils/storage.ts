import { GameSettings, ProgressMap } from '../types/game';

const PROGRESS_KEY = 'arrow_escape_progress_v1';
const SETTINGS_KEY = 'arrow_escape_settings_v1';
const TUTORIAL_KEY = 'arrow_escape_tutorial_seen_v1';
const CURRENT_LEVEL_KEY = 'arrow_escape_current_level_v1';

// In-memory fallback if localStorage fails or is blocked
const memoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn('LocalStorage unavailable, falling back to memory store:', e);
  }
  return memoryStore[key] || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch (e) {
    console.warn('LocalStorage write failed, saving to memory store:', e);
  }
  memoryStore[key] = value;
}

export const defaultSettings: GameSettings = {
  soundEnabled: true,
  soundVolume: 0.6,
  reducedMotion: false,
  showEscapeTrajectories: false,
  highContrast: false,
  colorScheme: 'mint',
};

export function loadProgress(): ProgressMap {
  const raw = safeGetItem(PROGRESS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    console.warn('Corrupted progress data, initializing fresh progress state');
  }
  return {};
}

export function saveProgress(progress: ProgressMap): void {
  try {
    safeSetItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

export function saveLevelProgress(
  levelId: string,
  stars: number,
  moves: number,
  timeSeconds: number
): ProgressMap {
  const progress = loadProgress();
  const existing = progress[levelId];

  const updatedStars = existing ? Math.max(existing.stars, stars) : stars;
  const bestMoves = existing ? Math.min(existing.bestMoves, moves) : moves;
  const bestTime = existing ? Math.min(existing.bestTime, timeSeconds) : timeSeconds;

  progress[levelId] = {
    completed: true,
    stars: updatedStars,
    bestMoves,
    bestTime,
  };

  saveProgress(progress);
  return progress;
}

export function loadSettings(): GameSettings {
  const raw = safeGetItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    safeSetItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function hasSeenTutorial(): boolean {
  return safeGetItem(TUTORIAL_KEY) === 'true';
}

export function markTutorialSeen(): void {
  safeSetItem(TUTORIAL_KEY, 'true');
}

export function loadLastPlayedLevelId(): string | null {
  return safeGetItem(CURRENT_LEVEL_KEY);
}

export function saveLastPlayedLevelId(levelId: string): void {
  safeSetItem(CURRENT_LEVEL_KEY, levelId);
}

export function resetAllData(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(PROGRESS_KEY);
      window.localStorage.removeItem(SETTINGS_KEY);
      window.localStorage.removeItem(TUTORIAL_KEY);
      window.localStorage.removeItem(CURRENT_LEVEL_KEY);
    }
  } catch (e) {
    console.warn('Failed to clear storage:', e);
  }
  delete memoryStore[PROGRESS_KEY];
  delete memoryStore[SETTINGS_KEY];
  delete memoryStore[TUTORIAL_KEY];
  delete memoryStore[CURRENT_LEVEL_KEY];
}
