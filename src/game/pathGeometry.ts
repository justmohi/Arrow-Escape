import { Arrow, Direction, GridPoint, LevelData } from '../types/game';
import { directionVector, getArrowCells } from './solver';

const DIRECTIONS: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
const perpendiculars: Record<Direction, Direction[]> = {
  UP: ['LEFT', 'RIGHT', 'UP', 'DOWN'],
  DOWN: ['RIGHT', 'LEFT', 'DOWN', 'UP'],
  LEFT: ['DOWN', 'UP', 'LEFT', 'RIGHT'],
  RIGHT: ['UP', 'DOWN', 'RIGHT', 'LEFT'],
};

const key = (p: GridPoint) => `${p.row},${p.col}`;
const inside = (p: GridPoint, rows: number, cols: number) =>
  p.row >= 0 && p.row < rows && p.col >= 0 && p.col < cols;

/**
 * Expands legacy single-cell levels into connected orthogonal paths.
 * Layouts are deterministic, cell-exclusive and sized to leave room for every path.
 */
export function buildBentPathLevel(source: LevelData): LevelData {
  const count = source.arrows.length;
  const side = Math.max(source.rows, source.cols, Math.ceil(Math.sqrt(count * 3)) + 1);
  const rows = side;
  const cols = side;
  const remapped = source.arrows.map((arrow) => ({
    ...arrow,
    row: Math.round(arrow.row * (rows - 1) / Math.max(1, source.rows - 1)),
    col: Math.round(arrow.col * (cols - 1) / Math.max(1, source.cols - 1)),
    path: undefined as GridPoint[] | undefined,
  }));

  // Reserve all arrowheads first, so no path can cover another arrowhead.
  const heads = new Set(remapped.map((arrow) => `${arrow.row},${arrow.col}`));
  const occupied = new Set(heads);
  const seeded = remapped.map((arrow, index) => {
    const path: GridPoint[] = [{ row: arrow.row, col: arrow.col }];
    let previousDirection: Direction | null = null;
    const desiredLength = count > 24 ? 3 : count > 12 ? 4 : 4;
    for (let step = 1; step < desiredLength; step++) {
      const current = path[path.length - 1];
      const order = previousDirection
        ? perpendiculars[previousDirection]
        : perpendiculars[arrow.direction];
      const candidates = order.map((direction) => {
        const [dr, dc] = directionVector(direction);
        return { point: { row: current.row + dr, col: current.col + dc }, direction };
      }).filter(({ point }) => inside(point, rows, cols) && !occupied.has(key(point)));
      if (!candidates.length) break;
      // Stable variation keeps paths visually diverse while remaining reproducible.
      const candidate = candidates[(index + step) % candidates.length];
      path.push(candidate.point);
      occupied.add(key(candidate.point));
      previousDirection = candidate.direction;
    }
    return { ...arrow, path: path.reverse() };
  });

  // Give each path a direction that does not cross any path that must remain on the board
  // after it is selected. Removing arrows in source order therefore always solves the level.
  const arrows: Arrow[] = seeded.map((arrow, index) => {
    const later = seeded.slice(index + 1);
    const clearDirections = DIRECTIONS.filter((direction) => {
      const [dr, dc] = directionVector(direction);
      let row = arrow.row;
      let col = arrow.col;
      while (true) {
        row += dr;
        col += dc;
        if (row < 0 || row >= rows || col < 0 || col >= cols) return true;
        if (later.some((other) => getArrowCells(other).some((cell) => cell.row === row && cell.col === col))) {
          return false;
        }
      }
    });
    const direction = clearDirections.includes(arrow.direction)
      ? arrow.direction
      : clearDirections[0] ?? arrow.direction;
    return { ...arrow, direction };
  });

  return {
    ...source,
    rows,
    cols,
    arrows,
    parMoves: arrows.length,
    description: source.description ?? 'Trace each bent path to its arrowhead, then clear the exit lane.',
  };
}
