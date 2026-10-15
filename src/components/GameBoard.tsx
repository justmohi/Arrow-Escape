import React, { useMemo } from 'react';
import { Arrow, GridPoint } from '../types/game';
import { directionVector, getArrowCells } from '../game/solver';

interface GameBoardProps {
  rows: number;
  cols: number;
  arrows: Arrow[];
  escapingIds: Set<string>;
  blockedId: string | null;
  blockedById: string | null;
  hintedId: string | null;
  reducedMotion: boolean;
  onArrowClick: (arrow: Arrow) => void;
}

const arrowColors: Record<NonNullable<Arrow['colorVariant']>, string> = {
  mint: '#172b4d',
  cyan: '#172b4d',
  amber: '#172b4d',
  emerald: '#172b4d',
  indigo: '#172b4d',
};

function cellKey(cell: GridPoint) {
  return `${cell.row},${cell.col}`;
}

function pointAt(cell: GridPoint) {
  return { x: (cell.col + 0.5) * 100, y: (cell.row + 0.5) * 100 };
}

function getArrowPath(arrow: Arrow) {
  const cells = getArrowCells(arrow);
  const points = cells.map(pointAt);
  if (points.length === 1) {
    const [dr, dc] = directionVector(arrow.direction);
    points.unshift({ x: points[0].x - dc * 28, y: points[0].y - dr * 28 });
  }
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function arrowHead(arrow: Arrow) {
  const { x, y } = pointAt({ row: arrow.row, col: arrow.col });
  const [dr, dc] = directionVector(arrow.direction);
  const tip = { x: x + dc * 37, y: y + dr * 37 };
  const base = { x: x - dc * 10, y: y - dr * 10 };
  const perp = { x: -dr * 15, y: dc * 15 };
  return `${tip.x},${tip.y} ${base.x + perp.x},${base.y + perp.y} ${base.x - perp.x},${base.y - perp.y}`;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  rows, cols, arrows, escapingIds, blockedId, blockedById, hintedId, reducedMotion, onArrowClick,
}) => {
  const cellMap = useMemo(() => {
    const map = new Map<string, Arrow>();
    for (const arrow of arrows) {
      for (const cell of getArrowCells(arrow)) map.set(cellKey(cell), arrow);
    }
    return map;
  }, [arrows]);

  const cells = useMemo(() => {
    const result: { row: number; col: number; arrow?: Arrow }[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        result.push({ row, col, arrow: cellMap.get(`${row},${col}`) });
      }
    }
    return result;
  }, [rows, cols, cellMap]);

  const boardSize = Math.max(rows, cols);
  const boardMaxWidth = boardSize <= 5 ? 'max-w-[440px]' : boardSize <= 8 ? 'max-w-[560px]' : 'max-w-[660px]';

  return (
    <div className="w-full flex items-center justify-center py-2 sm:py-4 px-2">
      <div className={`relative w-full ${boardMaxWidth} aspect-square puzzle-board-wrap`}>
        <div className="puzzle-board relative w-full h-full">
          <div
            className="puzzle-grid w-full h-full grid"
            style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {cells.map(({ row, col, arrow }) => (
              <button
                key={`cell_${row}_${col}`}
                type="button"
                aria-label={arrow ? `Select bent arrow at row ${arrow.row + 1}, column ${arrow.col + 1}` : 'Empty cell'}
                disabled={!arrow || escapingIds.has(arrow.id)}
                onClick={() => arrow && onArrowClick(arrow)}
                className={`path-hit-cell ${arrow ? 'path-hit-active' : ''} ${arrow && blockedId === arrow.id ? 'path-hit-blocked' : ''} ${arrow && blockedById === arrow.id ? 'path-hit-blocker' : ''} ${arrow && hintedId === arrow.id ? 'path-hit-hinted' : ''}`}
              />
            ))}
          </div>
          <svg
            className="arrow-path-overlay"
            viewBox={`0 0 ${cols * 100} ${rows * 100}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {arrows.map((arrow) => {
              const points = getArrowPath(arrow);
              const color = blockedId === arrow.id || blockedById === arrow.id
                ? '#ed4d5b'
                : hintedId === arrow.id
                  ? '#f0a52c'
                  : arrowColors[arrow.colorVariant ?? 'mint'];
              return (
                <g
                  key={arrow.id}
                  className={`bent-arrow bent-arrow-${arrow.direction.toLowerCase()} ${escapingIds.has(arrow.id) ? 'bent-arrow-escaping' : ''} ${reducedMotion ? 'bent-arrow-reduced-motion' : ''}`}
                  style={{ '--arrow-color': color } as React.CSSProperties}
                >
                  <polyline className="arrow-path-shadow" points={points} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity=".10" />
                  <polyline className="arrow-path-line" points={points} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                  <polygon className="arrow-head-shape" points={arrowHead(arrow)} fill={color} />
                  
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
