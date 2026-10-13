import React from 'react';
import { Award, Gamepad2, Settings, CircleHelp, Info, ShieldCheck, ChevronRight, Trophy, Star } from 'lucide-react';
import { ProgressMap } from '../types/game';

interface MeScreenProps {
  progress: ProgressMap;
  onSettings: () => void;
  onHelp: () => void;
  onAbout: () => void;
}

export const MeScreen: React.FC<MeScreenProps> = ({ progress, onSettings, onHelp, onAbout }) => {
  const entries = Object.values(progress);
  const completed = entries.filter(item => item.completed).length;
  const stars = entries.reduce((sum, item) => sum + (item.stars || 0), 0);
  const row = (icon: React.ReactNode, title: string, subtitle: string, action: () => void) => (
    <button type="button" className="profile-row" onClick={action}>
      <span className="profile-row-icon">{icon}</span>
      <span className="profile-row-copy"><strong>{title}</strong><small>{subtitle}</small></span>
      <ChevronRight size={18} />
    </button>
  );

  return (
    <section className="profile-screen w-full max-w-3xl mx-auto px-4 pb-8">
      <div className="profile-heading">
        <div className="profile-avatar">➜</div>
        <h1>My Game</h1>
        <p>Your puzzle journey at a glance</p>
      </div>
      <div className="profile-stats">
        <div><Trophy size={23} /><strong>{completed}</strong><span>Levels cleared</span></div>
        <div><Star size={23} /><strong>{stars}</strong><span>Stars earned</span></div>
      </div>
      <div className="profile-section-label">YOUR PROGRESS</div>
      <div className="profile-list">
        {row(<Award size={22} />, 'Awards', 'Your stars and milestones', onAbout)}
        {row(<Gamepad2 size={22} />, 'Achievements', 'Keep solving to improve your score', onAbout)}
      </div>
      <div className="profile-section-label">APP</div>
      <div className="profile-list">
        {row(<Settings size={22} />, 'Settings', 'Sound, motion and game options', onSettings)}
        {row(<CircleHelp size={22} />, 'Help', 'Learn how to play', onHelp)}
        {row(<Info size={22} />, 'About Game', 'About Arrow Escape', onAbout)}
        {row(<ShieldCheck size={22} />, 'Privacy', 'Local and cloud save information', onAbout)}
      </div>
    </section>
  );
};
