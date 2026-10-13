import React, { useState } from 'react';
import { X, Star, Lock, CheckCircle2, Sparkles, Play } from 'lucide-react';
import { Difficulty, LevelData, ProgressMap } from '../types/game';
import { HANDCRAFTED_LEVELS } from '../game/levels';

interface LevelSelectModalProps {
  isOpen: boolean;
  currentLevelId: string;
  progress: ProgressMap;
  onSelectLevel: (level: LevelData) => void;
  onStartProcedural: (difficulty: Difficulty) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  currentLevelId,
  progress,
  onSelectLevel,
  onStartProcedural,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<Difficulty>('easy');

  if (!isOpen) return null;

  const difficulties: { key: Difficulty; label: string; count: number }[] = [
    { key: 'easy', label: 'Easy', count: 8 },
    { key: 'medium', label: 'Medium', count: 10 },
    { key: 'hard', label: 'Hard', count: 8 },
    { key: 'expert', label: 'Expert', count: 8 },
  ];

  const levelsInTab = HANDCRAFTED_LEVELS.filter(l => l.difficulty === activeTab);

  // Unlocking rule: Easy is all unlocked; other difficulties unlock as you progress,
  // or level N is unlocked if level N-1 is completed. To ensure great UX, allow playing
  // any level in unlocked difficulties, or unlock subsequent levels once previous is cleared.
  const isLevelUnlocked = (level: LevelData, index: number): boolean => {
    if (activeTab === 'easy') return true; // Easy is fully accessible
    if (index === 0) return true; // First level of any tier is accessible
    // Previous level completed?
    const prevLevel = levelsInTab[index - 1];
    return !!progress[prevLevel.id]?.completed;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-select-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-2xl bg-[#0e172e] border border-white/[0.1] rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <h2 id="level-select-heading" className="text-xl font-bold tracking-tight text-white">
              Select Level
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose a handcrafted puzzle or create an infinite procedural board
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
            aria-label="Close Level Selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty Tabs (Segmented control) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-white/[0.06] rounded-xl my-4">
          {difficulties.map(diff => (
            <button
              key={diff.key}
              onClick={() => setActiveTab(diff.key)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === diff.key
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {diff.label}
            </button>
          ))}
        </div>

        {/* Levels Grid Container */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
          {levelsInTab.map((level, idx) => {
            const isUnlocked = isLevelUnlocked(level, idx);
            const isCurrent = level.id === currentLevelId;
            const levelProg = progress[level.id];
            const isCompleted = !!levelProg?.completed;
            const stars = levelProg?.stars || 0;

            return (
              <button
                key={level.id}
                disabled={!isUnlocked}
                onClick={() => {
                  onSelectLevel(level);
                  onClose();
                }}
                className={`group relative p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer h-28 ${
                  isCurrent
                    ? 'border-teal-400 bg-teal-950/30 ring-1 ring-teal-400/50'
                    : isCompleted
                    ? 'border-white/[0.12] bg-slate-900/90 hover:border-teal-400/40 hover:bg-slate-850'
                    : isUnlocked
                    ? 'border-white/[0.07] bg-slate-900/60 hover:border-white/[0.2] hover:bg-slate-850'
                    : 'border-white/[0.03] bg-slate-950/40 opacity-40 cursor-not-allowed'
                }`}
              >
                {/* Level Top Info */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-white">
                    {level.levelNumber}
                  </span>
                  {isCompleted ? (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map(s => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= stars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  ) : !isUnlocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {level.rows}x{level.cols}
                    </span>
                  )}
                </div>

                {/* Level Title */}
                <div>
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {level.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {level.arrows.length} arrows · {level.parMoves} par
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Banner: Procedural generator for active difficulty */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-slate-300 font-medium">
              Want endless puzzles?
            </span>
          </div>
          <button
            onClick={() => {
              onStartProcedural(activeTab);
              onClose();
            }}
            className="py-2 px-3.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-400/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Generate New {difficulties.find(d => d.key === activeTab)?.label} Puzzle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
