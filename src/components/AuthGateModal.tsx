import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Lock, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Cpu, 
  Mail, 
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { signInWithGoogle, auth, saveUserTrialToFirestore } from '../lib/firebase';
import GoogleSignInButton from './GoogleSignInButton';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  title?: string;
  reason?: string;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Sign Up to Start Your 7-Day Free Trial",
  reason = "Prompt dispatching requires a registered account. Start free today with full access to managed Claude and Gemini model subscriptions.",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorNotice(null);
    try {
      const { user } = await signInWithGoogle();
      // Initialize 7-day free trial in Firestore
      await saveUserTrialToFirestore({
        uid: user.uid,
        email: user.email || 'user@example.com',
        displayName: user.displayName || 'Trial User',
        plan: 'free_trial',
      });
      onSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorNotice(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickEmailTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setErrorNotice('Please enter a valid work or personal email address.');
      return;
    }

    setIsLoading(true);
    setErrorNotice(null);
    try {
      const mockUid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const trialUser = {
        uid: mockUid,
        email: emailInput.trim(),
        displayName: emailInput.split('@')[0],
      };

      await saveUserTrialToFirestore({
        uid: mockUid,
        email: emailInput.trim(),
        displayName: trialUser.displayName,
        plan: 'free_trial',
      });

      // Save user session in localStorage
      localStorage.setItem('whyor_trial_user', JSON.stringify(trialUser));
      onSuccess(trialUser);
      onClose();
    } catch (err: any) {
      setErrorNotice('Failed to initialize trial. Please try Google Sign-In.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-orange-500/20 to-amber-500/0 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-cyan-500/20 to-blue-500/0 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            7-Day Free Trial · No Credit Card Required
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {reason}
          </p>
        </div>

        {/* Trial Feature Highlights */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2.5 font-mono text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-slate-200"><strong>No credit card required</strong> — instant 1-click activation</span>
          </div>
          <div className="flex items-center gap-2 text-orange-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-slate-200">Full 7 Days free with managed Claude & Gemini subscriptions</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-slate-200">100,000 free tokens/day + AST multi-model router</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-slate-200">Cryptographic Context Ledger + up to 82% token savings</span>
          </div>
        </div>

        {/* Error Notice */}
        {errorNotice && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Sign In Options */}
        <div className="space-y-3 pt-1">
          {/* Google Sign-In */}
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-mono text-slate-500 uppercase">Or start with email</span>
            <div className="border-t border-white/10 w-full" />
          </div>

          {/* Quick Email Form */}
          <form onSubmit={handleQuickEmailTrial} className="space-y-2">
            <div className="flex items-center rounded-xl bg-slate-950/80 border border-white/15 px-3 py-2 focus-within:border-orange-500 transition-colors">
              <Mail className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="email"
                placeholder="Enter work or personal email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Setting up trial...' : 'Activate 7-Day Free Trial'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Terms note */}
        <p className="text-[10px] text-slate-500 text-center font-mono">
          After the 7-day trial period, users configure their own AI engine keys (BYOK) or choose an enterprise plan. No credit card required upfront.
        </p>

      </div>
    </div>
  );
};
