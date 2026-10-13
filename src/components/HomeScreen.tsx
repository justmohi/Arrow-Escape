import React from 'react';
import { CalendarDays, Trophy, Play, RotateCcw, ArrowUpRight, Sparkles } from 'lucide-react';

interface HomeScreenProps {
  levelNumber: number;
  onContinue: () => void;
  onRestart: () => void;
  onDaily: () => void;
  onTournament: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  levelNumber, onContinue, onRestart, onDaily, onTournament,
}) => {
  const today = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date());

  return (
    <section className="home-screen w-full max-w-4xl mx-auto px-4 pb-5">
      <div className="home-challenge-grid">
        <article className="challenge-card daily-card">
          <div className="challenge-icon"><CalendarDays size={29} strokeWidth={2.2} /></div>
          <span className="challenge-eyebrow">DAILY CHALLENGE</span>
          <h2>{today}</h2>
          <button type="button" className="challenge-play" onClick={onDaily}><Play size={16} fill="currentColor" /> Play</button>
        </article>
        <article className="challenge-card tournament-card">
          <span className="tournament-time"><span className="time-dot">◷</span> Weekly</span>
          <div className="challenge-icon trophy-icon"><Trophy size={29} strokeWidth={2.2} /></div>
          <span className="challenge-eyebrow">TOURNAMENT</span>
          <h2>Weekly Challenge</h2>
          <button type="button" className="challenge-play tournament-play" onClick={onTournament}>Explore <ArrowUpRight size={16} /></button>
        </article>
      </div>

      <div className="home-brand">
        <div className="brand-mark"><span>➜</span></div>
        <p className="brand-kicker">A little logic goes a long way</p>
        <h1>Arrow <span>Puzzle</span></h1>
        <p className="brand-description">Clear the paths. Free every arrow.</p>
      </div>

      <div className="home-actions">
        <button type="button" className="primary-game-action" onClick={onContinue}>
          <span><Play size={19} fill="currentColor" /> Continue Game</span>
          <small>Level {levelNumber}</small>
        </button>
        <button type="button" className="secondary-game-action" onClick={onRestart}>
          <RotateCcw size={17} /> Restart Game
        </button>
      </div>
      <div className="home-tip"><Sparkles size={15} /> Find a clear path before you tap an arrow.</div>
    </section>
  );
};
