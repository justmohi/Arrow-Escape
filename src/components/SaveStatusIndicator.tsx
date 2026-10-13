import React from 'react';
import { Cloud, CloudCheck, HardDrive, RefreshCw, AlertCircle, WifiOff } from 'lucide-react';
import { SyncStatus } from '../types/game';

interface SaveStatusIndicatorProps {
  status: SyncStatus;
  onClick?: () => void;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  onClick,
}) => {
  const getDetails = () => {
    switch (status) {
      case 'saved_cloud':
        return {
          icon: <Cloud className="w-3.5 h-3.5 text-teal-400" />,
          label: 'Cloud Saved',
          color: 'text-teal-300 border-teal-500/20 bg-teal-500/10 hover:bg-teal-500/15',
          title: 'Your progress is backed up to the cloud.',
        };
      case 'saving':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />,
          label: 'Saving...',
          color: 'text-cyan-300 border-cyan-500/20 bg-cyan-500/10',
          title: 'Saving your latest progress...',
        };
      case 'offline':
        return {
          icon: <WifiOff className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Offline (Saved Locally)',
          color: 'text-amber-300 border-amber-500/20 bg-amber-500/10',
          title: 'Saved locally on this device. Will sync to cloud when back online.',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Sync Retrying',
          color: 'text-rose-300 border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15',
          title: 'Cloud sync encountered an issue. Saved locally in browser storage.',
        };
      case 'saved_local':
      default:
        return {
          icon: <HardDrive className="w-3.5 h-3.5 text-slate-400" />,
          label: 'Guest Save',
          color: 'text-slate-400 border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08]',
          title: 'Saved in browser storage. Sign in to enable cloud saves across devices.',
        };
    }
  };

  const details = getDetails();

  return (
    <button
      type="button"
      onClick={onClick}
      title={details.title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer select-none ${details.color}`}
    >
      {details.icon}
      <span className="hidden sm:inline">{details.label}</span>
    </button>
  );
};
