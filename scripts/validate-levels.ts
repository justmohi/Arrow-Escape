import { HANDCRAFTED_LEVELS } from '../src/game/levels';
import { generateProceduralLevel } from '../src/game/generator';
import { getArrowCells, isLevelSolvable } from '../src/game/solver';
import { Difficulty, LevelData } from '../src/types/game';

function validateLevel(level: LevelData) {
  const occupied = new Map<string, string>();
  for (const arrow of level.arrows) {
    const cells = getArrowCells(arrow);
    if (cells.length < 2) throw new Error(`${level.id}/${arrow.id}: path must occupy at least two cells`);
    if (cells[cells.length - 1].row !== arrow.row || cells[cells.length - 1].col !== arrow.col) {
      throw new Error(`${level.id}/${arrow.id}: path must end at the arrowhead`);
    }
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (cell.row < 0 || cell.row >= level.rows || cell.col < 0 || cell.col >= level.cols) {
        throw new Error(`${level.id}/${arrow.id}: path leaves the board`);
      }
      const cellId = `${cell.row},${cell.col}`;
      const other = occupied.get(cellId);
      if (other && other !== arrow.id) throw new Error(`${level.id}: paths ${other} and ${arrow.id} overlap at ${cellId}`);
      occupied.set(cellId, arrow.id);
      if (i > 0) {
        const previous = cells[i - 1];
        const distance = Math.abs(previous.row - cell.row) + Math.abs(previous.col - cell.col);
        if (distance !== 1) throw new Error(`${level.id}/${arrow.id}: path segments must be orthogonally connected`);
      }
    }
  }
  if (!isLevelSolvable(level.arrows, level.rows, level.cols)) {
    throw new Error(`${level.id}: puzzle is not solvable`);
  }
}

for (const level of HANDCRAFTED_LEVELS) validateLevel(level);
const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
for (const difficulty of difficulties) validateLevel(generateProceduralLevel(difficulty));
console.log(`Validated ${HANDCRAFTED_LEVELS.length} campaign levels and 4 procedural levels.`);
