import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, LogOut, Cloud, RefreshCw, LogIn, ChevronDown, Check, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SaveStatusIndicator } from './SaveStatusIndicator';

interface AccountMenuProps {
  onOpenAuth: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({ onOpenAuth }) => {
  const { user, syncStatus, signOut, forceCloudSync } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await forceCloudSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <SaveStatusIndicator status={syncStatus} onClick={onOpenAuth} />
        <button
          onClick={onOpenAuth}
          className="py-1.5 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign In</span>
        </button>
      </div>
    );
  }

  // Authenticated user avatar & dropdown
  const initials = user.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'P';

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      <SaveStatusIndicator status={syncStatus} onClick={handleManualSync} />

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] hover:border-white/[0.15] text-slate-200 transition-colors cursor-pointer"
        aria-label="User account menu"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Avatar'}
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-lg object-cover border border-teal-500/30"
          />
        ) : (
          <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs flex items-center justify-center border border-teal-500/30">
            {initials}
          </div>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
      </button>

      {/* Account Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#0e172e] border border-white/[0.12] rounded-2xl p-3 shadow-2xl z-50 animate-fade-in flex flex-col gap-2">
          {/* User Profile Header */}
          <div className="pb-2 border-b border-white/[0.08]">
            <p className="text-xs font-bold text-white truncate">
              {user.displayName || 'Arrow Master'}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {user.email}
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
              <Cloud className="w-3 h-3" />
              <span>Cloud Sync Active</span>
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full py-2 px-2.5 rounded-xl hover:bg-white/[0.06] text-slate-300 hover:text-white text-xs font-medium flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Cloud Save Now</span>
            </span>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full py-2 px-2.5 rounded-xl hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer border-t border-white/[0.06] pt-2"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
