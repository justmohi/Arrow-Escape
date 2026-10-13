export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Arrow {
  id: string;
  row: number;
  col: number;
  direction: Direction;
  colorVariant?: 'mint' | 'cyan' | 'amber' | 'emerald' | 'indigo';
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface LevelData {
  id: string;
  levelNumber: number;
  name: string;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  arrows: Arrow[];
  parMoves: number;
  description?: string;
  isProcedural?: boolean;
}

export interface MoveRecord {
  arrow: Arrow;
  remainingCount: number;
  timestamp: number;
}

export interface LevelProgress {
  completed: boolean;
  stars: number; // 1 to 3
  bestMoves: number;
  bestTime: number; // seconds
}

export type ProgressMap = Record<string, LevelProgress>;

export interface GameSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  reducedMotion: boolean;
  showEscapeTrajectories: boolean;
  highContrast: boolean;
  colorScheme: 'mint' | 'cyan' | 'violet' | 'amber';
}

export type GameView = 'MENU' | 'PLAY' | 'LEVEL_SELECT' | 'GENERATOR';

export interface GameStats {
  totalLevelsCompleted: number;
  totalStars: number;
  totalArrowsCleared: number;
  fastestSolveTime: number | null;
}

export type SyncStatus = 'saved_cloud' | 'saved_local' | 'saving' | 'error' | 'offline';

export interface CloudUserData {
  userId: string;
  email?: string;
  displayName?: string;
  progress: ProgressMap;
  settings: GameSettings;
  lastPlayedLevelId?: string;
  stats?: GameStats;
  updatedAt: string;
  version: number;
}
