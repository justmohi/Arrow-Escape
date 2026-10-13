import React, { useState } from 'react';
import { Sparkles, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { Difficulty, LevelData } from '../types/game';
import { generateProceduralLevel } from '../game/generator';

interface GeneratorViewProps {
  onStartLevel: (level: LevelData) => void;
  onBackToCampaign: () => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  onStartLevel,
  onBackToCampaign,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [isGenerating, setIsGenerating] = useState(false);

  const difficultyDetails: Record<
    Difficulty,
    { label: string; grid: string; arrows: string; desc: string }
  > = {
    easy: {
      label: 'Easy',
      grid: '4x4 Grid',
      arrows: '6–8 Arrows',
      desc: 'Gentle warm-up puzzles with straightforward unblocking sequences.',
    },
    medium: {
      label: 'Medium',
      grid: '5x5 Grid',
      arrows: '12–15 Arrows',
      desc: 'Balanced topological puzzles with interlocking branches.',
    },
    hard: {
      label: 'Hard',
      grid: '6x6 Grid',
      arrows: '18–22 Arrows',
      desc: 'Intricate mazes with tight corridors and deep dependency chains.',
    },
    expert: {
      label: 'Expert',
      grid: '7x7 Grid',
      arrows: '26–30 Arrows',
      desc: 'Master challenges with multi-layered concentric locks.',
    },
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const level = generateProceduralLevel(selectedDifficulty);
        onStartLevel(level);
      } finally {
        setIsGenerating(false);
      }
    }, 250);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Header Info */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Solvability-Guaranteed Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Infinite Puzzle Generator
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Create endless, unique, validated puzzles. Every generated state is reverse-constructed and verified to be 100% solvable.
        </p>
      </div>

      {/* Difficulty Selection Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
        {(Object.keys(difficultyDetails) as Difficulty[]).map((diff) => {
          const isSelected = selectedDifficulty === diff;
          const info = difficultyDetails[diff];

          return (
            <button
              key={diff}
              type="button"
              onClick={() => setSelectedDifficulty(diff)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-teal-950/40 to-slate-900 border-teal-400/60 ring-2 ring-teal-400/30 shadow-lg'
                  : 'bg-slate-900/60 border-white/[0.08] hover:border-white/[0.2] hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-base text-white">{info.label}</span>
                <span className="text-xs font-mono text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded-md">
                  {info.grid}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">{info.desc}</p>
              <div className="text-[11px] font-mono text-slate-500">
                Density: {info.arrows}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-teal-500/20 transition-all cursor-pointer active:scale-98"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Synthesizing Solvable Grid...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Generate & Play Now</span>
            </>
          )}
        </button>

        <button
          onClick={onBackToCampaign}
          className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition-colors cursor-pointer"
        >
          Return to Campaign
        </button>
      </div>
    </div>
  );
};
