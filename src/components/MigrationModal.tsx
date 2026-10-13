import React from 'react';
import { GitMerge, HardDrive, Cloud, Star, CheckCircle, ShieldCheck } from 'lucide-react';
import { CloudUserData, ProgressMap } from '../types/game';

interface MigrationModalProps {
  isOpen: boolean;
  cloudData: CloudUserData;
  localProgress: ProgressMap;
  onChoice: (choice: 'merge' | 'local' | 'cloud') => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  cloudData,
  localProgress,
  onChoice,
}) => {
  if (!isOpen) return null;

  // Calculate stats for local vs cloud
  const calcStats = (prog: ProgressMap) => {
    const levels = Object.values(prog).filter((p) => p.completed);
    const completedCount = levels.length;
    const starsCount = levels.reduce((sum, p) => sum + (p.stars || 0), 0);
    return { completedCount, starsCount };
  };

  const localStats = calcStats(localProgress);
  const cloudStats = calcStats(cloudData.progress);

  const formatUpdatedDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="migration-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-lg bg-[#0e172e] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-3 text-teal-300">
            <GitMerge className="w-6 h-6 text-teal-400" />
          </div>
          <h2 id="migration-heading" className="text-2xl font-bold tracking-tight text-white">
            Sync Conflicting Saves
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            We noticed game progress on this browser and in your cloud account. How would you like to proceed?
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Local Guest Progress */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/[0.08] flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-200">Local Device</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">
                {localStats.completedCount} Levels Done
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{localStats.starsCount} Stars</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-3 block">Guest session</span>
          </div>

          {/* Cloud Save */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-teal-500/30 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-teal-300">Cloud Account</span>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-white">
                {cloudStats.completedCount} Levels Done
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{cloudStats.starsCount} Stars</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-3 block">
              {formatUpdatedDate(cloudData.updatedAt)}
            </span>
          </div>
        </div>

        {/* Choice Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Option 1: Smart Merge (Recommended) */}
          <button
            onClick={() => onChoice('merge')}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-teal-500/20 transition-all cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-2.5 text-left">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <div>
                <div>Smart Merge (Recommended)</div>
                <div className="text-[11px] font-normal text-slate-900 opacity-90">
                  Combine both: keep all completed levels and highest star scores
                </div>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 shrink-0 hidden sm:block" />
          </button>

          {/* Option 2: Keep Cloud Save */}
          <button
            onClick={() => onChoice('cloud')}
            className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-slate-200 hover:text-white border border-white/[0.08] hover:border-white/[0.2] text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-left">
              <Cloud className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Use Cloud Save ({cloudStats.completedCount} levels)</span>
            </div>
          </button>

          {/* Option 3: Keep Local Save */}
          <button
            onClick={() => onChoice('local')}
            className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-slate-200 hover:text-white border border-white/[0.08] hover:border-white/[0.2] text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-left">
              <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Use Local Device Save ({localStats.completedCount} levels)</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
