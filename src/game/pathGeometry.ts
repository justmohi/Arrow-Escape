import { Arrow, Direction, GridPoint, LevelData } from '../types/game';
import { directionVector, getArrowCells } from './solver';

const DIRECTIONS: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
const perpendiculars: Record<Direction, Direction[]> = {
  UP: ['LEFT', 'RIGHT', 'UP', 'DOWN'],
  DOWN: ['RIGHT', 'LEFT', 'DOWN', 'UP'],
  LEFT: ['DOWN', 'UP', 'LEFT', 'RIGHT'],
  RIGHT: ['UP', 'DOWN', 'RIGHT', 'LEFT'],
};

const key = (point: GridPoint) => `${point.row},${point.col}`;
const inside = (point: GridPoint, rows: number, cols: number) =>
  point.row >= 0 && point.row < rows && point.col >= 0 && point.col < cols;

/** Expands legacy single-cell levels into connected orthogonal paths with exclusive cells. */
export function buildBentPathLevel(source: LevelData): LevelData {
  const count = source.arrows.length;
  const side = Math.max(source.rows, source.cols, Math.ceil(Math.sqrt(count * 3)) + 3);
  const rows = side;
  const cols = side;
  const remapped: Arrow[] = source.arrows.map((arrow) => ({
    ...arrow,
    row: Math.round(arrow.row * (rows - 1) / Math.max(1, source.rows - 1)),
    col: Math.round(arrow.col * (cols - 1) / Math.max(1, source.cols - 1)),
    path: undefined,
  }));

  const heads = new Set(remapped.map((arrow) => `${arrow.row},${arrow.col}`));
  const occupied = new Set(heads);
  const paths = remapped.map((arrow) => ({
    arrow,
    cells: [{ row: arrow.row, col: arrow.col }] as GridPoint[],
    lastDirection: null as Direction | null,
  }));

  // Give every arrow a first body cell before any path is allowed to grow longer.
  // The most constrained heads are placed first so they cannot be starved by long neighbors.
  const priority = paths.map((entry, index) => ({ entry, index })).sort((a, b) => {
    const degree = (arrow: Arrow) => DIRECTIONS.filter((direction) => {
      const [dr, dc] = directionVector(direction);
      const point = { row: arrow.row + dr, col: arrow.col + dc };
      return inside(point, rows, cols) && !heads.has(key(point));
    }).length;
    return degree(a.entry.arrow) - degree(b.entry.arrow) || a.index - b.index;
  });

  for (const { entry, index } of priority) {
    const head = entry.cells[0];
    const candidates = perpendiculars[entry.arrow.direction].map((direction) => {
      const [dr, dc] = directionVector(direction);
      return { point: { row: head.row + dr, col: head.col + dc }, direction };
    }).filter(({ point }) => inside(point, rows, cols) && !occupied.has(key(point)));
    if (!candidates.length) {
      // The extra board margin should make this rare; keep the arrow connected by
      // borrowing the nearest free orthogonal neighbor, never by overlapping a path.
      const fallback = DIRECTIONS.map((direction) => {
        const [dr, dc] = directionVector(direction);
        return { point: { row: head.row + dr, col: head.col + dc }, direction };
      }).find(({ point }) => inside(point, rows, cols) && !occupied.has(key(point)));
      if (fallback) {
        entry.cells.push(fallback.point);
        entry.lastDirection = fallback.direction;
        occupied.add(key(fallback.point));
      }
      continue;
    }
    const candidate = candidates[(index + 1) % candidates.length];
    entry.cells.push(candidate.point);
    entry.lastDirection = candidate.direction;
    occupied.add(key(candidate.point));
  }

  // Grow the paths by adding a turn, creating the long bent shapes seen in the reference.
  for (const { entry, index } of priority) {
    const targetLength = count > 24 ? 5 : count > 14 ? 7 : 8;
    while (entry.cells.length < targetLength) {
      const end = entry.cells[entry.cells.length - 1];
      const order: Direction[] = entry.lastDirection
        ? perpendiculars[entry.lastDirection]
        : perpendiculars[entry.arrow.direction];
      const candidates: { point: GridPoint; direction: Direction }[] = order.map((direction: Direction) => {
        const [dr, dc] = directionVector(direction);
        return { point: { row: end.row + dr, col: end.col + dc }, direction };
      }).filter(({ point }) => inside(point, rows, cols) && !occupied.has(key(point)));
      if (!candidates.length) break;
      const candidate = candidates[(index + entry.cells.length) % candidates.length];
      entry.cells.push(candidate.point);
      entry.lastDirection = candidate.direction;
      occupied.add(key(candidate.point));
    }
  }

  const seeded: Arrow[] = paths.map(({ arrow, cells }) => ({ ...arrow, path: [...cells].reverse() }));

  // Build a guaranteed removal order against the complete paths. At each step,
  // select an arrow whose exit ray is clear of every arrow still on the board.
  // This mirrors the real game mechanic and prevents cyclic direction assignments.
  const remaining = [...seeded];
  const ordered: Arrow[] = [];
  while (remaining.length) {
    const options = remaining.flatMap((arrow) => {
      const clearDirections = DIRECTIONS.filter((direction) => {
        const [dr, dc] = directionVector(direction);
        let row = arrow.row;
        let col = arrow.col;
        while (true) {
          row += dr;
          col += dc;
          if (row < 0 || row >= rows || col < 0 || col >= cols) return true;
          if (remaining.some((other) => other.id !== arrow.id &&
            getArrowCells(other).some((cell) => cell.row === row && cell.col === col))) return false;
        }
      });
      return clearDirections.map((direction) => ({ arrow, direction }));
    });

    if (!options.length) {
      // Direction is part of the puzzle data, so resolve a rare cycle by choosing
      // the arrow/direction with the fewest blockers; following removals will then
      // be re-evaluated against the updated board.
      let best: { arrow: Arrow; direction: Direction; blockers: number } | null = null;
      for (const arrow of remaining) {
        for (const direction of DIRECTIONS) {
          const [dr, dc] = directionVector(direction);
          let row = arrow.row;
          let col = arrow.col;
          let blockers = 0;
          while (true) {
            row += dr;
            col += dc;
            if (row < 0 || row >= rows || col < 0 || col >= cols) break;
            if (remaining.some((other) => other.id !== arrow.id &&
              getArrowCells(other).some((cell) => cell.row === row && cell.col === col))) blockers++;
          }
          if (!best || blockers < best.blockers) best = { arrow, direction, blockers };
        }
      }
      if (!best) break;
      // The chosen arrow is assigned its least-blocked exit, then the next pass
      // recalculates visibility after its removal.
      ordered.push({ ...best.arrow, direction: best.direction });
      remaining.splice(remaining.findIndex((item) => item.id === best!.arrow.id), 1);
      continue;
    }

    const chosen = options[0];
    ordered.push({ ...chosen.arrow, direction: chosen.direction });
    remaining.splice(remaining.findIndex((item) => item.id === chosen.arrow.id), 1);
  }
  const arrows = ordered;

  return {
    ...source,
    rows,
    cols,
    arrows,
    parMoves: arrows.length,
    description: source.description ?? 'Trace each bent path to its arrowhead, then clear the exit lane.',
  };
}
