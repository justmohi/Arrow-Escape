import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, ArrowRight, RotateCcw, Grid, Trophy } from 'lucide-react';
import { LevelData } from '../types/game';

interface VictoryModalProps {
  isOpen: boolean;
  level: LevelData;
  moves: number;
  timeSeconds: number;
  isNewBest: boolean;
  hasNextLevel: boolean;
  reducedMotion: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onSelectLevel: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  level,
  moves,
  timeSeconds,
  isNewBest,
  hasNextLevel,
  reducedMotion,
  onNextLevel,
  onReplay,
  onSelectLevel,
}) => {
  // Calculate stars: 3 for par or better, 2 for <= par + 2, 1 otherwise
  const stars = moves <= level.parMoves ? 3 : moves <= level.parMoves + 2 ? 2 : 1;

  useEffect(() => {
    if (isOpen && !reducedMotion) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#2dd4bf', '#06b6d4', '#38bdf8', '#fbbf24', '#ffffff'],
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isOpen, reducedMotion]);

  if (!isOpen) return null;

  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-sm bg-[#0e172e] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center">
        {/* Glow Accent */}
        <div
          className="absolute -top-12 inset-x-12 h-24 bg-teal-500/20 rounded-full blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Victory Trophy Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 border border-teal-400/30 flex items-center justify-center mb-4 text-teal-300 shadow-inner">
          <Trophy className="w-8 h-8 text-teal-400" />
        </div>

        <h2 id="victory-heading" className="text-2xl font-bold tracking-tight text-white mb-1">
          Puzzle Cleared!
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          {level.isProcedural ? 'Infinite challenge mastered' : `${level.name} completed`}
        </p>

        {/* Star Rating Display */}
        <div className="flex items-center gap-2 mb-6" aria-label={`${stars} out of 3 stars`}>
          {[1, 2, 3].map((starIdx) => (
            <Star
              key={starIdx}
              className={`w-8 h-8 transition-all ${
                starIdx <= stars
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] scale-105'
                  : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Stats Summary Grid */}
        <div className="w-full grid grid-cols-2 gap-3 bg-slate-900/60 border border-white/[0.06] rounded-2xl p-3.5 mb-6 text-left">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Moves</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold font-mono tabular-nums text-white">{moves}</span>
              <span className="text-xs text-slate-500 font-mono">/ {level.parMoves} par</span>
            </div>
            {isNewBest && (
              <span className="text-[10px] text-teal-400 font-medium mt-0.5">★ New Best!</span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Time</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold font-mono tabular-nums text-white">
                {formatTime(timeSeconds)}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 capitalize mt-0.5">
              {level.difficulty} Difficulty
            </span>
          </div>
        </div>

        {/* Action Buttons: Next Level as primary CTA */}
        <div className="w-full flex flex-col gap-2.5">
          {hasNextLevel ? (
            <button
              onClick={onNextLevel}
              autoFocus
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all cursor-pointer active:scale-98"
            >
              <span>Next Level</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onSelectLevel}
              autoFocus
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-98"
            >
              <span>Choose Next Challenge</span>
              <Grid className="w-4 h-4" />
            </button>
          )}

          <div className="w-full flex items-center gap-2">
            <button
              onClick={onReplay}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>

            <button
              onClick={onSelectLevel}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>All Levels</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
