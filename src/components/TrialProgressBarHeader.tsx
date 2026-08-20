import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  KeyRound, 
  Layers, 
  SlidersHorizontal,
  Flame,
  ChevronRight
} from 'lucide-react';
import { 
  UserTrialInfo, 
  getUserTrialFromFirestore, 
  saveUserTrialToFirestore, 
  auth, 
  onAuthChanged 
} from '../lib/firebase';
import { UpgradeToProModal } from './UpgradeToProModal';

interface TrialProgressBarHeaderProps {
  onNavigateTab?: (tab: string) => void;
  activePersonaEmail?: string;
}

export const TrialProgressBarHeader: React.FC<TrialProgressBarHeaderProps> = ({
  onNavigateTab,
  activePersonaEmail
}) => {
  const [trialInfo, setTrialInfo] = useState<UserTrialInfo | null>(null);
  const [simulatedDaysRemaining, setSimulatedDaysRemaining] = useState<number | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [showSimControls, setShowSimControls] = useState(false);

  // Hydrate trial data from Firestore or local fallback
  const fetchTrial = async (uid?: string, email?: string) => {
    try {
      const activeUid = uid || auth.currentUser?.uid || 'demo_user_1';
      const activeEmail = email || auth.currentUser?.email || activePersonaEmail || 'dispatcher@whyor.in';
      
      const data = await getUserTrialFromFirestore(activeUid, activeEmail);
      if (data) {
        setTrialInfo(data);
      } else {
        // Default initial 7-day state
        const fallback: UserTrialInfo = {
          uid: activeUid,
          email: activeEmail,
          displayName: activeEmail.split('@')[0],
          plan: 'free_trial',
          planType: 'free_trial',
          isPaidPlan: false,
          signupDate: new Date().toISOString(),
          trialStartDate: new Date().toISOString(),
          trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          trialDaysTotal: 7,
          daysRemaining: 4, // Default sample at 4 days left
          isTrialActive: true,
          isExpired: false,
          hasConfiguredByok: false,
          dailyTokensUsed: 14200,
          dailyTokenLimit: 100000,
          totalTokensProcessed: 89400,
          totalDispatches: 24,
          updatedAt: new Date().toISOString(),
        };
        setTrialInfo(fallback);
      }
    } catch (e) {
      console.warn('Notice loading trial info in header:', e);
    }
  };

  useEffect(() => {
    const unsub = onAuthChanged((u) => {
      fetchTrial(u?.uid, u?.email || activePersonaEmail);
    });
    return () => unsub();
  }, [activePersonaEmail]);

  const daysLeft = simulatedDaysRemaining !== null 
    ? simulatedDaysRemaining 
    : (trialInfo?.daysRemaining ?? 4);

  const totalDays = trialInfo?.trialDaysTotal || 7;
  const isPaid = trialInfo?.isPaidPlan || trialInfo?.plan === 'pro' || trialInfo?.plan === 'enterprise';
  const isUnderThreeDays = !isPaid && daysLeft < 3;
  const isExpired = !isPaid && daysLeft <= 0;

  // Percentage of trial completed and remaining
  const percentageRemaining = Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100)));

  // Color scheme based on urgency
  const getProgressColor = () => {
    if (daysLeft >= 4) return 'from-emerald-400 via-teal-400 to-cyan-500';
    if (daysLeft === 3) return 'from-amber-400 via-amber-500 to-orange-500';
    return 'from-orange-500 via-rose-500 to-red-500';
  };

  const handleSimulateChange = (val: number) => {
    setSimulatedDaysRemaining(val);
    if (trialInfo) {
      setTrialInfo({
        ...trialInfo,
        daysRemaining: val,
        isTrialActive: val > 0,
        isExpired: val <= 0,
      });
    }
  };

  return (
    <>
      <div 
        id="dashboard-trial-progress-header"
        className={`w-full rounded-2xl border transition-all relative overflow-hidden backdrop-blur-xl shadow-xl ${
          isPaid 
            ? 'bg-slate-900/60 border-emerald-500/30'
            : isUnderThreeDays
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-orange-500/40 shadow-orange-500/5 ring-1 ring-orange-500/20'
            : 'bg-slate-900/60 border-white/10'
        }`}
      >
        {/* Luminous accent gradient line at top */}
        <div 
          className={`h-0.5 w-full bg-gradient-to-r ${
            isPaid 
              ? 'from-emerald-400 via-teal-400 to-cyan-400' 
              : getProgressColor()
          }`} 
        />

        <div className="p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Status & Metric Details */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div 
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
                isPaid 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                  : isUnderThreeDays
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 animate-pulse'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
              }`}
            >
              {isPaid ? (
                <ShieldCheck className="w-5 h-5" />
              ) : isUnderThreeDays ? (
                <Flame className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-xs sm:text-sm text-white tracking-tight">
                  {isPaid ? (
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      WhyOr Dispatch Pro Active
                    </span>
                  ) : (
                    <span>7-Day Free Trial</span>
                  )}
                </span>

                {isPaid ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                    UNLIMITED PRO
                  </span>
                ) : isExpired ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40 uppercase">
                    TRIAL EXPIRED
                  </span>
                ) : (
                  <span 
                    className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${
                      isUnderThreeDays 
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' 
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
                    }`}
                  >
                    {daysLeft} {daysLeft === 1 ? 'DAY' : 'DAYS'} REMAINING
                  </span>
                )}

                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  • Managed Claude 3.7 & Gemini 2.5 Subscription Pool
                </span>
              </div>

              <p className="text-[11px] text-slate-400 font-mono truncate">
                {isPaid ? (
                  <span>Full Pareto optimization & unrestricted BYOK direct dispatching enabled.</span>
                ) : isUnderThreeDays ? (
                  <span className="text-orange-300 font-medium">
                    ⚠️ Urgent: Trial expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}. Upgrade to Pro to prevent disruption to your multi-model routing.
                  </span>
                ) : (
                  <span>
                    Day {totalDays - daysLeft + 1} of {totalDays} — All 7 Task Archetypes & Cryptographic Ledger active.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Center / Right: Visual Progress Bar & Action CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:gap-6 flex-1 lg:max-w-xl justify-end">
            
            {/* Visual Progress Bar (when on trial) */}
            {!isPaid && (
              <div className="flex-1 min-w-[180px] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3 h-3 text-orange-400" />
                    <span>Trial Progress</span>
                  </span>
                  <span className="text-white font-bold">
                    {daysLeft} / {totalDays} Days Left ({percentageRemaining}%)
                  </span>
                </div>

                {/* Progress Track with 7 Day Segments */}
                <div className="relative w-full h-2.5 rounded-full bg-slate-950 border border-white/10 overflow-hidden p-0.5 shadow-inner">
                  {/* Segment dividers for 7 days */}
                  <div className="absolute inset-0 grid grid-cols-7 pointer-events-none z-10 opacity-30">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="border-r border-white/40 h-full last:border-r-0" />
                    ))}
                  </div>

                  {/* Animated Fill Bar */}
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 shadow-sm`}
                    style={{ width: `${percentageRemaining}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions: Upgrade Button & Simulation Control */}
            <div className="flex items-center gap-2 justify-end shrink-0">
              
              {/* Upgrade to Pro Button - prominently displayed when trial is under 3 days */}
              {isUnderThreeDays && (
                <button
                  id="header-upgrade-to-pro-btn"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-orange-500/25 animate-bounce-subtle transition-all cursor-pointer ring-1 ring-orange-400/50"
                  title="Upgrade to Pro to maintain unlimited dispatches and direct BYOK keys"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>Upgrade to Pro</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}

              {/* Standard Pro Plan / BYOK button if >= 3 days */}
              {!isUnderThreeDays && !isPaid && (
                <button
                  id="header-view-plans-btn"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-mono text-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Pro Plan ($29/mo)</span>
                </button>
              )}

              {/* If already on Paid Plan */}
              {isPaid && (
                <button
                  onClick={() => onNavigateTab && onNavigateTab('credentials')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-xs transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3 h-3 text-emerald-400" />
                  <span>Manage Keys</span>
                </button>
              )}

              {/* Simulation / Day Ticks Quick Switcher for Testers */}
              <div className="relative">
                <button
                  onClick={() => setShowSimControls(!showSimControls)}
                  className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                  title="Toggle Trial Simulation Mode to test <3 days threshold"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>

                {showSimControls && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-slate-950 border border-white/15 shadow-2xl p-3 z-50 animate-in fade-in space-y-2 text-xs font-mono">
                    <div className="text-[10px] text-amber-400 font-bold uppercase border-b border-white/10 pb-1 flex items-center justify-between">
                      <span>Test Remaining Days</span>
                      <span className="text-slate-500 font-normal">Eval Mode</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[7, 5, 4, 2, 1, 0].map((d) => (
                        <button
                          key={d}
                          onClick={() => {
                            handleSimulateChange(d);
                            setShowSimControls(false);
                          }}
                          className={`px-2 py-1 rounded-lg text-left transition-colors cursor-pointer ${
                            daysLeft === d
                              ? 'bg-orange-500 text-slate-950 font-bold'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {d} {d === 1 ? 'day' : 'days'} {d < 3 ? '⚠️' : ''}
                        </button>
                      ))}
                    </div>
                    <div className="pt-1 border-t border-white/10 flex justify-between">
                      <button
                        onClick={() => {
                          setSimulatedDaysRemaining(null);
                          setShowSimControls(false);
                          fetchTrial();
                        }}
                        className="text-[10px] text-cyan-400 hover:underline"
                      >
                        Reset to Real Data
                      </button>
                      <button
                        onClick={() => setShowSimControls(false)}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Upgrade to Pro Modal */}
      <UpgradeToProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentTrial={trialInfo}
        onUpgradeSuccess={(updated) => {
          setTrialInfo(updated);
          setSimulatedDaysRemaining(null);
        }}
        onNavigateTab={onNavigateTab}
      />
    </>
  );
};
