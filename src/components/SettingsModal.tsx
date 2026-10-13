import React, { useState } from 'react';
import { X, Volume2, VolumeX, Eye, AlertTriangle, Check, RotateCcw, Cloud, HardDrive, LogIn } from 'lucide-react';
import { GameSettings } from '../types/game';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onResetData: () => void;
  onOpenAuth: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onResetData,
  onOpenAuth,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const { user, syncStatus } = useAuth();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md bg-[#0e172e] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h2 id="settings-heading" className="text-xl font-bold tracking-tight text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 py-4">
          {/* Cloud Save & Account Section */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-300">
                {user ? <Cloud className="w-5 h-5 text-teal-400" /> : <HardDrive className="w-5 h-5 text-slate-400" />}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {user ? (user.displayName || user.email) : 'Guest Mode'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {user ? 'Cloud Saves Active' : 'Saved locally in this browser'}
                </span>
              </div>
            </div>

            {!user && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="py-1.5 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Sound Toggle & Volume */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                Sound Effects
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundEnabled}
                onClick={() =>
                  onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                  settings.soundEnabled ? 'bg-teal-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="flex items-center gap-3 mt-1 px-1">
                <span className="text-xs text-slate-400 w-12">Volume</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, soundVolume: parseFloat(e.target.value) })
                  }
                  className="w-full accent-teal-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  aria-label="Sound Volume"
                />
                <span className="text-xs font-mono text-slate-400 w-8 text-right">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Reduced Motion Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <div>
              <span className="text-sm font-medium text-slate-200 block">
                Reduced Motion
              </span>
              <span className="text-xs text-slate-400">
                Disables screen shakes and fast animations
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.reducedMotion}
              onClick={() =>
                onUpdateSettings({ ...settings, reducedMotion: !settings.reducedMotion })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                settings.reducedMotion ? 'bg-teal-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Keyboard Shortcuts List */}
          <div className="pt-2 border-t border-white/[0.06]">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
              Keyboard Shortcuts
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
              <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-white/[0.04]">
                <span className="text-slate-400">Undo</span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-white/[0.1] rounded text-[11px] text-teal-300">U</kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-white/[0.04]">
                <span className="text-slate-400">Hint</span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-white/[0.1] rounded text-[11px] text-teal-300">H</kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-white/[0.04]">
                <span className="text-slate-400">Restart</span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-white/[0.1] rounded text-[11px] text-teal-300">R</kbd>
              </div>
              <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-white/[0.04]">
                <span className="text-slate-400">Close</span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-white/[0.1] rounded text-[11px] text-teal-300">Esc</kbd>
              </div>
            </div>
          </div>

          {/* Danger Zone: Reset Data */}
          <div className="pt-2 border-t border-white/[0.06]">
            {confirmReset ? (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex flex-col gap-2">
                <p className="text-xs text-rose-300 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  Reset all puzzle progress and high scores?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onResetData();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Yes, Reset Everything
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full py-2 px-3 rounded-xl border border-white/[0.06] hover:border-rose-500/30 text-slate-400 hover:text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Saved Progress</span>
              </button>
            )}
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-100 font-semibold text-xs transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
