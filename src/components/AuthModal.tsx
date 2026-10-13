import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
}) => {
  const { signInGoogle, signInEmail, signUpEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFormState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  const handleSwitchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setMode(newMode);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signInGoogle();
      onClose();
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    if (mode !== 'forgot' && (!password || password.length < 6)) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await signInEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        await signUpEmail(email, password, displayName);
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMessage('Password reset link sent! Check your inbox.');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md bg-[#0e172e] border border-white/[0.1] rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-3 text-teal-300">
            <Sparkles className="w-6 h-6 text-teal-400" />
          </div>
          <h2 id="auth-modal-title" className="text-2xl font-bold tracking-tight text-white">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Your Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'Sign in to sync your puzzles and achievements across devices.'}
            {mode === 'register' && 'Save your solved levels and high scores permanently in the cloud.'}
            {mode === 'forgot' && 'Enter your email to receive password reset instructions.'}
          </p>
        </div>

        {/* Google Sign-in Button (Shown in login and register modes) */}
        {mode !== 'forgot' && (
          <div className="mb-5">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-white font-medium text-xs sm:text-sm border border-white/[0.12] hover:border-white/[0.25] flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm active:scale-98 disabled:opacity-50"
            >
              {/* Google G SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-[1px] bg-white/[0.08]" />
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                Or with email
              </span>
              <div className="flex-1 h-[1px] bg-white/[0.08]" />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-start gap-2.5 text-teal-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-teal-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Display Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Player Name"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('forgot')}
                    className="text-[11px] text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Email'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch between Login / Register / Forgot */}
        <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className="text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            Play as Guest
          </button>
        </div>
      </div>
    </div>
  );
};
