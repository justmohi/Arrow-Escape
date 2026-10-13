import { Arrow, Direction } from '../types/game';

export interface PathCheckResult {
  canEscape: boolean;
  blockedBy?: Arrow;
  pathLength: number; // cells traveled to escape or hit blocker
}

/**
 * Checks if an arrow can escape off the board in its pointing direction without hitting another arrow.
 */
export function checkEscapePath(
  arrow: Arrow,
  allArrows: Arrow[],
  rows: number,
  cols: number
): PathCheckResult {
  // Build a lookup map of active arrows for O(1) cell inspection
  const grid = new Map<string, Arrow>();
  for (const a of allArrows) {
    if (a.id !== arrow.id) {
      grid.set(`${a.row},${a.col}`, a);
    }
  }

  let r = arrow.row;
  let c = arrow.col;
  let pathLength = 0;

  const dr = arrow.direction === 'UP' ? -1 : arrow.direction === 'DOWN' ? 1 : 0;
  const dc = arrow.direction === 'LEFT' ? -1 : arrow.direction === 'RIGHT' ? 1 : 0;

  while (true) {
    r += dr;
    c += dc;
    pathLength++;

    // Did it reach beyond the board boundary?
    if (r < 0 || r >= rows || c < 0 || c >= cols) {
      return {
        canEscape: true,
        pathLength,
      };
    }

    // Is there another arrow blocking the ray?
    const blocker = grid.get(`${r},${c}`);
    if (blocker) {
      return {
        canEscape: false,
        blockedBy: blocker,
        pathLength,
      };
    }
  }
}

/**
 * Returns all arrows that can currently escape without being blocked.
 */
export function getEscapableArrows(
  allArrows: Arrow[],
  rows: number,
  cols: number
): Arrow[] {
  return allArrows.filter(arrow => checkEscapePath(arrow, allArrows, rows, cols).canEscape);
}

/**
 * Solves the puzzle from the given state, returning an ordered list of arrow removals,
 * or null if no valid sequence clears the board.
 */
export function solvePuzzle(
  initialArrows: Arrow[],
  rows: number,
  cols: number,
  maxNodes: number = 2000
): Arrow[] | null {
  // Quick check: empty board is trivially solved
  if (initialArrows.length === 0) return [];

  // DFS with state visited set to prevent redundant search
  const stateKey = (arrows: Arrow[]) =>
    arrows.map(a => a.id).sort().join(',');

  const visited = new Set<string>();
  let nodesExplored = 0;

  function dfs(currentArrows: Arrow[], path: Arrow[]): Arrow[] | null {
    nodesExplored++;
    if (nodesExplored > maxNodes) return null;

    if (currentArrows.length === 0) {
      return path;
    }

    const key = stateKey(currentArrows);
    if (visited.has(key)) return null;
    visited.add(key);

    const escapable = getEscapableArrows(currentArrows, rows, cols);
    if (escapable.length === 0) {
      return null; // Dead end
    }

    // Heuristic sort: try arrows that unlock other arrows first
    // Or arrows closest to boundaries
    for (const arrow of escapable) {
      const remaining = currentArrows.filter(a => a.id !== arrow.id);
      const res = dfs(remaining, [...path, arrow]);
      if (res) return res;
    }

    return null;
  }

  return dfs(initialArrows, []);
}

/**
 * Returns the best next arrow to remove to help the player solve the level.
 */
export function getHintArrow(
  currentArrows: Arrow[],
  rows: number,
  cols: number
): Arrow | null {
  // First, check if solver finds a full path
  const solution = solvePuzzle(currentArrows, rows, cols);
  if (solution && solution.length > 0) {
    return solution[0];
  }

  // Fallback: any currently unblocked arrow
  const escapable = getEscapableArrows(currentArrows, rows, cols);
  if (escapable.length > 0) {
    return escapable[0];
  }

  return null;
}

/**
 * Verifies if a given level state is 100% solvable.
 */
export function isLevelSolvable(
  arrows: Arrow[],
  rows: number,
  cols: number
): boolean {
  const sol = solvePuzzle(arrows, rows, cols);
  return sol !== null && sol.length === arrows.length;
}

/**
 * Returns arrow rotation degree for CSS transforms.
 */
export function getDirectionAngle(dir: Direction): number {
  switch (dir) {
    case 'UP': return 0;
    case 'RIGHT': return 90;
    case 'DOWN': return 180;
    case 'LEFT': return 270;
  }
}
