import React from 'react';
import { Volume2, VolumeX, Settings, HelpCircle, Grid, Sparkles } from 'lucide-react';
import { GameView } from '../types/game';
import { AccountMenu } from './AccountMenu';

interface HeaderProps {
  currentView: GameView;
  onNavigate: (view: GameView) => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenTutorial,
  onOpenSettings,
  onOpenAuth,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="w-full border-b border-white/[0.08] bg-[#070d1d]/85 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('PLAY')}
          className="text-lg md:text-xl font-bold tracking-tight text-white hover:text-teal-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-md py-1 px-1.5"
          aria-label="Arrow Escape Home"
        >
          <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
            ➔
          </span>
          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Arrow Escape
          </span>
        </button>

        {/* Zone 2: Navigation Links (Clean single-line prose, no pills) */}
        <nav className="hidden sm:flex items-center gap-5 text-sm font-medium text-slate-400">
          <button
            onClick={() => onNavigate('PLAY')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer py-1 ${
              currentView === 'PLAY' ? 'text-teal-400 font-semibold border-b-2 border-teal-400' : ''
            }`}
          >
            Campaign
          </button>
          <button
            onClick={() => onNavigate('LEVEL_SELECT')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer py-1 ${
              currentView === 'LEVEL_SELECT' ? 'text-teal-400 font-semibold border-b-2 border-teal-400' : ''
            }`}
          >
            Levels
          </button>
          <button
            onClick={() => onNavigate('GENERATOR')}
            className={`whitespace-nowrap transition-colors hover:text-white cursor-pointer py-1 flex items-center gap-1.5 ${
              currentView === 'GENERATOR' ? 'text-teal-400 font-semibold border-b-2 border-teal-400' : ''
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Infinite Mode
          </button>
          <button
            onClick={onOpenTutorial}
            className="whitespace-nowrap transition-colors hover:text-white cursor-pointer py-1"
          >
            How to Play
          </button>
        </nav>

        {/* Zone 3: Quick Action Controls + Account Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile level select quick button */}
          <button
            onClick={() => onNavigate('LEVEL_SELECT')}
            className="sm:hidden p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
            aria-label="Select Level"
            title="Select Level"
          >
            <Grid className="w-5 h-5" />
          </button>

          {/* Quick Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-teal-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {/* Tutorial button on mobile */}
          <button
            onClick={onOpenTutorial}
            className="sm:hidden p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
            aria-label="How to play"
            title="How to play"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
            aria-label="Game Settings"
            title="Game Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Account / Auth Menu */}
          <AccountMenu onOpenAuth={onOpenAuth} />
        </div>
      </div>
    </header>
  );
};
