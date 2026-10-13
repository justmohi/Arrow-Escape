import React, { useMemo } from 'react';
import { Arrow } from '../types/game';
import { ArrowCell } from './ArrowCell';

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

export const GameBoard: React.FC<GameBoardProps> = ({
  rows,
  cols,
  arrows,
  escapingIds,
  blockedId,
  blockedById,
  hintedId,
  reducedMotion,
  onArrowClick,
}) => {
  // Map of "row,col" -> Arrow for fast grid lookup
  const arrowGrid = useMemo(() => {
    const map = new Map<string, Arrow>();
    for (const arrow of arrows) {
      map.set(`${arrow.row},${arrow.col}`, arrow);
    }
    return map;
  }, [arrows]);

  // Generate grid cell coordinates
  const cells = useMemo(() => {
    const list: { r: number; c: number; arrow?: Arrow }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({
          r,
          c,
          arrow: arrowGrid.get(`${r},${c}`),
        });
      }
    }
    return list;
  }, [rows, cols, arrowGrid]);

  // Compute maximum board dimensions to maintain a clean square aspect ratio and prevent overflow
  // On mobile: max ~360px-400px; on desktop: max 520px
  const maxDim = Math.max(rows, cols);
  const boardMaxWidth = maxDim <= 4 ? 'max-w-[360px]' : maxDim <= 5 ? 'max-w-[440px]' : 'max-w-[520px]';

  return (
    <div className="w-full flex items-center justify-center py-2 sm:py-4 px-2">
      <div className={`relative w-full ${boardMaxWidth} aspect-square`}>
        {/* Subtle Ambient Glow Behind Board */}
        <div
          className="absolute -inset-4 bg-gradient-to-tr from-teal-500/10 via-cyan-500/5 to-indigo-500/10 rounded-3xl blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Board Enclosure Frame */}
        <div className="relative w-full h-full bg-[#0b1328]/95 border border-white/[0.08] rounded-3xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl flex flex-col justify-center items-center">
          {/* Subtle perimeter dots / exit indicators */}
          <div className="absolute inset-x-8 top-1 flex justify-between pointer-events-none opacity-20">
            <span className="text-[10px] text-teal-400 font-mono">▲</span>
            <span className="text-[10px] text-teal-400 font-mono">▲</span>
          </div>
          <div className="absolute inset-x-8 bottom-1 flex justify-between pointer-events-none opacity-20">
            <span className="text-[10px] text-teal-400 font-mono">▼</span>
            <span className="text-[10px] text-teal-400 font-mono">▼</span>
          </div>
          <div className="absolute inset-y-8 left-1 flex flex-col justify-between pointer-events-none opacity-20">
            <span className="text-[10px] text-teal-400 font-mono">◀</span>
            <span className="text-[10px] text-teal-400 font-mono">◀</span>
          </div>
          <div className="absolute inset-y-8 right-1 flex flex-col justify-between pointer-events-none opacity-20">
            <span className="text-[10px] text-teal-400 font-mono">▶</span>
            <span className="text-[10px] text-teal-400 font-mono">▶</span>
          </div>

          {/* Dynamic Grid Layout */}
          <div
            className="w-full h-full grid gap-1.5 sm:gap-2.5"
            style={{
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            }}
          >
            {cells.map(({ r, c, arrow }) => {
              const cellKey = `cell_${r}_${c}`;
              const isEscaping = arrow ? escapingIds.has(arrow.id) : false;
              const isBlocked = arrow ? blockedId === arrow.id : false;
              const isBlocker = arrow ? blockedById === arrow.id : false;
              const isHinted = arrow ? hintedId === arrow.id : false;

              return (
                <div key={cellKey} className="relative w-full h-full flex items-center justify-center">
                  <ArrowCell
                    arrow={arrow}
                    cellSize={0}
                    isEscaping={isEscaping}
                    isBlocked={isBlocked || isBlocker}
                    isHinted={isHinted}
                    reducedMotion={reducedMotion}
                    onClick={onArrowClick}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
