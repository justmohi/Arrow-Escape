import { Arrow, Direction, GridPoint } from '../types/game';

export interface PathCheckResult {
  canEscape: boolean;
  blockedBy?: Arrow;
  pathLength: number;
}

export function getArrowCells(arrow: Arrow): GridPoint[] {
  return arrow.path?.length ? arrow.path : [{ row: arrow.row, col: arrow.col }];
}

/** The arrowhead ray is blocked by any cell occupied by another complete arrow path. */
export function checkEscapePath(
  arrow: Arrow,
  allArrows: Arrow[],
  rows: number,
  cols: number,
): PathCheckResult {
  const occupied = new Map<string, Arrow>();
  for (const other of allArrows) {
    if (other.id === arrow.id) continue;
    for (const cell of getArrowCells(other)) occupied.set(`${cell.row},${cell.col}`, other);
  }

  let row = arrow.row;
  let col = arrow.col;
  let pathLength = 0;
  const [dr, dc] = directionVector(arrow.direction);

  while (true) {
    row += dr;
    col += dc;
    pathLength++;
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return { canEscape: true, pathLength };
    }
    const blocker = occupied.get(`${row},${col}`);
    if (blocker) return { canEscape: false, blockedBy: blocker, pathLength };
  }
}

export function getEscapableArrows(allArrows: Arrow[], rows: number, cols: number): Arrow[] {
  return allArrows.filter((arrow) => checkEscapePath(arrow, allArrows, rows, cols).canEscape);
}

export function solvePuzzle(
  initialArrows: Arrow[],
  rows: number,
  cols: number,
  maxNodes = 20000,
): Arrow[] | null {
  if (initialArrows.length === 0) return [];
  const visited = new Set<string>();
  let nodesExplored = 0;

  function dfs(current: Arrow[], path: Arrow[]): Arrow[] | null {
    if (current.length === 0) return path;
    if (++nodesExplored > maxNodes) return null;
    const key = current.map((a) => a.id).sort().join(',');
    if (visited.has(key)) return null;
    visited.add(key);

    const options = getEscapableArrows(current, rows, cols);
    if (!options.length) return null;
    // Prefer arrows whose removal opens the most occupied ray cells.
    options.sort((a, b) => {
      const score = (candidate: Arrow) => {
        const [dr, dc] = directionVector(candidate.direction);
        let r = candidate.row;
        let c = candidate.col;
        let count = 0;
        while (true) {
          r += dr; c += dc;
          if (r < 0 || r >= rows || c < 0 || c >= cols) return count;
          if (current.some((other) => other.id !== candidate.id &&
              getArrowCells(other).some((cell) => cell.row === r && cell.col === c))) count++;
        }
      };
      return score(b) - score(a);
    });

    for (const arrow of options) {
      const result = dfs(current.filter((a) => a.id !== arrow.id), [...path, arrow]);
      if (result) return result;
    }
    return null;
  }
  return dfs(initialArrows, []);
}

export function getHintArrow(currentArrows: Arrow[], rows: number, cols: number): Arrow | null {
  const solution = solvePuzzle(currentArrows, rows, cols);
  return solution?.[0] ?? getEscapableArrows(currentArrows, rows, cols)[0] ?? null;
}

export function isLevelSolvable(arrows: Arrow[], rows: number, cols: number): boolean {
  const solution = solvePuzzle(arrows, rows, cols);
  return solution !== null && solution.length === arrows.length;
}

export function directionVector(dir: Direction): [number, number] {
  switch (dir) {
    case 'UP': return [-1, 0];
    case 'DOWN': return [1, 0];
    case 'LEFT': return [0, -1];
    case 'RIGHT': return [0, 1];
  }
}

export function getDirectionAngle(dir: Direction): number {
  switch (dir) {
    case 'UP': return 0;
    case 'RIGHT': return 90;
    case 'DOWN': return 180;
    case 'LEFT': return 270;
  }
}
