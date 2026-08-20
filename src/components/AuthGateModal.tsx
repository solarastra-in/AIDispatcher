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
  AlertCircle,
  RefreshCw,
  Clock,
  Send
} from 'lucide-react';
import { signInWithGoogle, saveUserTrialToFirestore } from '../lib/firebase';

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
  reason = "Free trial access requires authenticating with Google Auth or confirming your email address with a 6-digit activation code.",
}) => {
  const [authStep, setAuthStep] = useState<'initial' | 'email_pending_verification'>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [devVerificationCode, setDevVerificationCode] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  if (!isOpen) return null;

  // 1. Google Authentication
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
        emailVerified: true,
      });

      const trialUserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Trial User',
        emailVerified: true,
        isTrialActive: true,
        daysRemaining: 7,
      };

      localStorage.setItem('whyor_trial_user', JSON.stringify(trialUserData));
      onSuccess(trialUserData);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorNotice(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Step 1: Submit Email for Verification Link & Code
  const handleRegisterEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorNotice('Please enter a valid work or personal email address.');
      return;
    }

    setIsLoading(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const res = await fetch('/api/auth/register-email-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          displayName: displayNameInput.trim() || cleanEmail.split('@')[0],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthStep('email_pending_verification');
        setVerificationToken(data.token);
        if (data.verificationCodeDev) {
          setDevVerificationCode(data.verificationCodeDev);
        }
        setSuccessNotice(`Activation email dispatched to ${cleanEmail}. Enter the 6-digit code or click the link in your email.`);
      } else {
        setErrorNotice(data.error || 'Failed to dispatch verification email.');
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Network error sending verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Step 2: Confirm 6-Digit Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCodeInput.trim() || verificationCodeInput.trim().length < 6) {
      setErrorNotice('Please enter the full 6-digit verification code sent to your email.');
      return;
    }

    setIsLoading(true);
    setErrorNotice(null);

    try {
      const res = await fetch('/api/auth/verify-email-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim().toLowerCase(),
          code: verificationCodeInput.trim(),
          token: verificationToken,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await saveUserTrialToFirestore({
          uid: data.user.uid,
          email: data.user.email,
          displayName: data.user.displayName,
          plan: 'free_trial',
          emailVerified: true,
        });

        localStorage.setItem('whyor_trial_user', JSON.stringify(data.user));
        onSuccess(data.user);
        onClose();
      } else {
        setErrorNotice(data.error || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to verify activation code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Resend Verification Code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setErrorNotice(null);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim().toLowerCase(),
          displayName: displayNameInput.trim() || emailInput.split('@')[0],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.verificationCodeDev) {
          setDevVerificationCode(data.verificationCodeDev);
        }
        setSuccessNotice('Fresh verification code and link sent to your email.');
        setResendCooldown(30);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrorNotice(data.error || 'Failed to resend verification code.');
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Error resending verification code.');
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
            7-Day Free Trial · Verified Account Required
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            {authStep === 'email_pending_verification' ? 'Enter 6-Digit Email Code' : title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {authStep === 'email_pending_verification'
              ? `We sent a 6-digit confirmation code and activation link to ${emailInput}. Enter the code below or click the link in your email.`
              : reason}
          </p>
        </div>

        {/* Trial Highlights */}
        {authStep === 'initial' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-slate-200"><strong>Google Auth or Email Verification</strong> ensures secure trial allocation</span>
            </div>
            <div className="flex items-center gap-2 text-orange-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-slate-200">100,000 free tokens/day across Claude & Gemini models</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-slate-200">No credit card required upfront</span>
            </div>
          </div>
        )}

        {/* Feedback Notices */}
        {errorNotice && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorNotice}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* STEP 1: INITIAL SELECTION & FORM */}
        {authStep === 'initial' ? (
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
              <span>{isLoading ? 'Connecting...' : 'Continue with Google Auth'}</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] font-mono text-slate-500 uppercase">Or Register with Email</span>
              <div className="border-t border-white/10 w-full" />
            </div>

            {/* Email Registration Form */}
            <form onSubmit={handleRegisterEmail} className="space-y-2.5">
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Your Name (Optional)"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/80 border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="flex items-center rounded-xl bg-slate-950/80 border border-white/15 px-3.5 py-2.5 focus-within:border-orange-500 transition-colors">
                <Mail className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="email"
                  placeholder="Enter work or personal email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Sending Verification Email...' : 'Send Verification Code & Activation Link'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* STEP 2: 6-DIGIT CODE & VERIFICATION SCREEN */
          <div className="space-y-4 pt-1">
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-3">
                <label className="block text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-48 mx-auto text-center font-mono text-2xl font-bold tracking-widest px-4 py-2.5 rounded-xl bg-slate-900 border border-orange-500/60 text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-slate-500 font-mono">
                  Enter the code from the email sent to <strong className="text-slate-300">{emailInput}</strong>
                </p>
              </div>

              {devVerificationCode && (
                <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs font-mono flex items-center justify-between">
                  <span>Demo Sandbox Code: <strong>{devVerificationCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setVerificationCodeInput(devVerificationCode)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-200 underline font-sans"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || verificationCodeInput.length < 6}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isLoading ? 'Verifying Code...' : 'Verify Email & Activate Free Trial'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setAuthStep('initial')}
                className="text-slate-400 hover:text-slate-200"
              >
                ← Change Email
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading || resendCooldown > 0}
                className="text-orange-400 hover:text-orange-300 disabled:text-slate-600 font-medium flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Terms footer */}
        <p className="text-[10px] text-slate-500 text-center font-mono">
          After the 7-day trial period, users configure their own AI engine keys (BYOK) or choose an enterprise plan.
        </p>

      </div>
    </div>
  );
};

