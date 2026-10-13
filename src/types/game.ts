export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface GridPoint {
  row: number;
  col: number;
}

export interface Arrow {
  id: string;
  /** Arrowhead cell. Kept for compatibility with existing saved progress and level definitions. */
  row: number;
  col: number;
  direction: Direction;
  /** Ordered path from tail to arrowhead; every point is an occupied board cell. */
  path?: GridPoint[];
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
  stars: number;
  bestMoves: number;
  bestTime: number;
}

export type ProgressMap = Record<string, LevelProgress>;

export interface GameSettings {
  soundEnabled: boolean;
  soundVolume: number;
  reducedMotion: boolean;
  showEscapeTrajectories: boolean;
  highContrast: boolean;
  colorScheme: 'mint' | 'cyan' | 'violet' | 'amber';
}

export type GameView = 'HOME' | 'ME' | 'MENU' | 'PLAY' | 'LEVEL_SELECT' | 'GENERATOR';

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
