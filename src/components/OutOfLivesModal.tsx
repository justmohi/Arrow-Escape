import React from 'react';
import { Heart, RotateCcw } from 'lucide-react';

interface OutOfLivesModalProps {
  onContinue: () => void;
  onRestart: () => void;
}

export const OutOfLivesModal: React.FC<OutOfLivesModalProps> = ({ onContinue, onRestart }) => (
  <div className="lives-overlay" role="dialog" aria-modal="true" aria-labelledby="out-of-lives-title">
    <div className="lives-dialog">
      <h2 id="out-of-lives-title">Out of Lives!</h2>
      <div className="lives-heart-art"><Heart size={68} fill="#f34d62" stroke="#f34d62" /><span>+1</span></div>
      <p>You used all three lives. Continue with one practice life or restart this puzzle.</p>
      <button type="button" className="lives-primary" onClick={onContinue}><Heart size={18} fill="currentColor" /> Continue with 1 Life</button>
      <button type="button" className="lives-secondary" onClick={onRestart}><RotateCcw size={17} /> Restart Game</button>
    </div>
  </div>
);
