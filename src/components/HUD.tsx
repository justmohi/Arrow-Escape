import React from 'react';
import { RotateCcw, Undo2, Lightbulb, Heart } from 'lucide-react';
import { Difficulty } from '../types/game';

interface HUDProps {
  levelNumber: number;
  levelName: string;
  difficulty: Difficulty;
  isProcedural?: boolean;
  moves: number;
  parMoves: number;
  remainingArrows: number;
  totalArrows: number;
  timerSeconds: number;
  canUndo: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onHint: () => void;
  hintCountUsed: number;
  isHintActive: boolean;
  lives: number;
}

export const HUD: React.FC<HUDProps> = ({
  levelNumber,
  levelName,
  difficulty,
  isProcedural,
  moves,
  parMoves,
  remainingArrows,
  totalArrows,
  timerSeconds,
  canUndo,
  onUndo,
  onRestart,
  onHint,
  hintCountUsed,
  isHintActive,
  lives,
}) => {
  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs.toString().padStart(2, '0')}`;
  };

  const difficultyLabels: Record<Difficulty, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-3 flex flex-col gap-3">
      {/* Top Metadata Row: Clean Unboxed Text with typographic separators */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">
            {isProcedural ? 'Infinite Mode' : `Level ${levelNumber}`}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{levelName}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="capitalize text-teal-400">{difficultyLabels[difficulty]}</span>
        </div>

        <div className="flex items-center gap-2 font-mono tabular-nums text-slate-400">
          <span>{formatTime(timerSeconds)}</span>
        </div>
      </div>

      <div className="lives-status-row" aria-label={`${lives} lives remaining`}>
        <div className="lives-count"><span className="lives-arrow-mark">➤</span><strong>{remainingArrows}</strong></div>
        <div className="lives-heart-list">
          {[0, 1, 2].map((life) => (
            <Heart key={life} size={25} strokeWidth={1.8} fill={life < lives ? '#f34d62' : '#dfe5ec'} color={life < lives ? '#f34d62' : '#dfe5ec'} />
          ))}
        </div>
        <span className={`difficulty-chip difficulty-${difficulty}`}>{difficultyLabels[difficulty]}</span>
      </div>

      {/* Main Stats and Controls Bar */}
      <div className="flex items-center justify-between gap-3 bg-[#0d162e]/90 border border-white/[0.07] rounded-xl px-4 py-2.5 shadow-sm">
        {/* Left: Move & Progress Counters */}
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Moves</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
                {moves}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ {parMoves} par</span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-white/[0.08]" aria-hidden="true" />

          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Remaining</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-teal-300">
                {remainingArrows}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ {totalArrows}</span>
            </div>
          </div>
        </div>

        {/* Right: Working Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo Button */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo move (Press U)"
            title="Undo move (U)"
            className={`p-2 sm:px-3 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              canUndo
                ? 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white border border-white/[0.08] hover:border-white/[0.15] active:scale-95'
                : 'bg-transparent text-slate-600 border border-transparent cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Hint Button */}
          <button
            onClick={onHint}
            aria-label="Get Hint (Press H)"
            title="Get Hint (H)"
            className={`p-2 sm:px-3 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95 ${
              isHintActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white border-white/[0.08] hover:border-white/[0.15]'
            }`}
          >
            <Lightbulb className={`w-4 h-4 ${isHintActive ? 'text-amber-400 animate-pulse' : 'text-amber-300/80'}`} />
            <span className="hidden sm:inline">Hint</span>
            {hintCountUsed > 0 && (
              <span className="text-[10px] text-slate-400 font-mono">({hintCountUsed})</span>
            )}
          </button>

          {/* Restart Button */}
          <button
            onClick={onRestart}
            aria-label="Restart Level (Press R)"
            title="Restart Level (R)"
            className="p-2 sm:px-3 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
