import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'How to Play Arrow Escape',
      subtitle: 'A satisfying logic puzzle where timing is everything',
      icon: <Sparkles className="w-8 h-8 text-teal-400" />,
      content: (
        <div className="flex flex-col gap-3 text-sm text-slate-300">
          <p>
            Your objective is to <strong className="text-white">clear the entire board</strong> by sending each arrow off the grid.
          </p>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold text-lg">
              ➔
            </span>
            <span className="text-xs text-slate-400">
              Each arrow occupies a grid cell and points in one of 4 directions.
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Check the Escape Path',
      subtitle: 'Arrows cannot pass through other arrows',
      icon: <ShieldAlert className="w-8 h-8 text-rose-400" />,
      content: (
        <div className="flex flex-col gap-3 text-sm text-slate-300">
          <p>
            When you tap an arrow, it checks every cell along its forward path.
          </p>
          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/20 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Blocked Path:
            </div>
            <p className="text-xs text-slate-300">
              If another arrow is in the way, your move is rejected with a bump animation. You must clear the obstacle arrow first!
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-teal-950/30 border border-teal-500/20 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              Clear Path:
            </div>
            <p className="text-xs text-slate-300">
              If the path to the edge of the board is completely unobstructed, the arrow escapes!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Tools & Perfection',
      subtitle: 'Strategize for 3-star ratings',
      icon: <CheckCircle2 className="w-8 h-8 text-amber-400" />,
      content: (
        <div className="flex flex-col gap-3 text-sm text-slate-300">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06]">
              <strong className="text-teal-300 block mb-1">💡 Hints</strong>
              Stuck? Tap Hint to reveal an arrow that is guaranteed to have a clean exit path.
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06]">
              <strong className="text-cyan-300 block mb-1">↺ Undo & Restart</strong>
              Experiment freely! You can undo any move or restart the puzzle at zero penalty.
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ⭐ Solve puzzles within the par move count to earn all 3 stars!
          </p>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md bg-[#0e172e] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
          aria-label="Close tutorial"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Icon */}
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/[0.08] flex items-center justify-center mb-4">
          {currentStep.icon}
        </div>

        {/* Title */}
        <h2 id="tutorial-heading" className="text-xl font-bold tracking-tight text-white">
          {currentStep.title}
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          {currentStep.subtitle}
        </p>

        {/* Content */}
        <div className="min-h-[160px] flex flex-col justify-center mb-6">
          {currentStep.content}
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === step
                    ? 'w-6 bg-teal-400'
                    : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="py-2 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <span>Start Playing!</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
