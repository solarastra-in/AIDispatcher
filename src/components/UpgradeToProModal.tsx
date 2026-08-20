import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Zap, 
  ArrowRight, 
  KeyRound, 
  Layers, 
  Lock, 
  CheckCircle2, 
  Clock,
  Flame,
  Star
} from 'lucide-react';
import { UserTrialInfo, saveUserTrialToFirestore, recordAuditLogToFirestore, auth } from '../lib/firebase';
import confetti from 'canvas-confetti';

interface UpgradeToProModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrial: UserTrialInfo | null;
  onUpgradeSuccess: (updatedTrial: UserTrialInfo) => void;
  onNavigateTab?: (tab: string) => void;
}

export const UpgradeToProModal: React.FC<UpgradeToProModalProps> = ({
  isOpen,
  onClose,
  currentTrial,
  onUpgradeSuccess,
  onNavigateTab
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmUpgrade = async () => {
    setIsProcessing(true);
    setSuccessMessage(null);
    try {
      const uid = currentTrial?.uid || auth.currentUser?.uid || `user_${Date.now()}`;
      const email = currentTrial?.email || auth.currentUser?.email || 'user@example.com';
      const displayName = currentTrial?.displayName || auth.currentUser?.displayName || 'Pro Dispatcher';

      const updated = await saveUserTrialToFirestore({
        uid,
        email,
        displayName,
        plan: selectedPlan,
        planType: selectedPlan,
        isPaidPlan: true,
        isTrialActive: false,
        daysRemaining: 365,
        trialEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        hasConfiguredByok: true,
        dailyTokenLimit: selectedPlan === 'enterprise' ? 10000000 : 2000000,
      });

      await recordAuditLogToFirestore(
        'Upgraded Subscription Plan',
        'billing_upgrade',
        email,
        `User upgraded from 7-day trial to ${selectedPlan.toUpperCase()} plan (${billingCycle}).`
      );

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Confetti fallback
      }

      setSuccessMessage(`Congratulations! Your account is now upgraded to ${selectedPlan.toUpperCase()}.`);
      setTimeout(() => {
        onUpgradeSuccess(updated);
        onClose();
        if (onNavigateTab) {
          onNavigateTab('credentials');
        }
      }, 1200);

    } catch (err: any) {
      console.error('Upgrade error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden">
        
        {/* Ambient Gradient Glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between relative z-10 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold font-display text-white">
                Upgrade to WhyOr Dispatch Pro
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Keep full Pareto optimization, cryptographic context hashing, and unrestricted multi-model routing without interruptions.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-2 relative z-10">
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-1 flex items-center text-xs font-mono">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-slate-800 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-orange-500 text-slate-950 font-bold shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[9px] font-bold">20% OFF</span>
            </button>
          </div>
        </div>

        {/* Plan Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          
          {/* Pro Plan Card */}
          <div 
            onClick={() => setSelectedPlan('pro')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
              selectedPlan === 'pro'
                ? 'bg-slate-800/90 border-orange-500 shadow-xl shadow-orange-500/10 ring-1 ring-orange-400/50'
                : 'bg-slate-950/60 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase text-orange-400 font-bold flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Pro Plan
              </span>
              {selectedPlan === 'pro' && (
                <span className="w-5 h-5 rounded-full bg-orange-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <div className="mb-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-display text-white">
                  {billingCycle === 'annual' ? '$29' : '$39'}
                </span>
                <span className="text-xs font-mono text-slate-400">/ seat / month</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                For developers & teams demanding maximum Pareto cost reduction.
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-300 font-mono pt-2 border-t border-white/5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Unlimited Multi-Model Dispatches</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Bring Your Own Keys (BYOK direct)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>SHA-256 Context Ledger & Ledger Audit</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>FastAPI 14-Endpoint Surface Access</span>
              </li>
            </ul>
          </div>

          {/* Enterprise Plan Card */}
          <div 
            onClick={() => setSelectedPlan('enterprise')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
              selectedPlan === 'enterprise'
                ? 'bg-slate-800/90 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                : 'bg-slate-950/60 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Enterprise
              </span>
              {selectedPlan === 'enterprise' && (
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <div className="mb-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-display text-white">
                  {billingCycle === 'annual' ? '$149' : '$199'}
                </span>
                <span className="text-xs font-mono text-slate-400">/ team / month</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                For organizations requiring dedicated governance & VPC deployments.
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-300 font-mono pt-2 border-t border-white/5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Everything in Pro Plan</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>SSO / SAML 2.0 & RBAC Policies</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>VPC & Self-Hosted Ollama Support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Dedicated SLA & Priority Routing</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 relative z-10">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Instant activation · Cancel anytime</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-white/10 transition-colors cursor-pointer"
            >
              Keep Free Trial
            </button>

            <button
              onClick={handleConfirmUpgrade}
              disabled={isProcessing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Upgrading Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Confirm Upgrade ({selectedPlan.toUpperCase()})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
