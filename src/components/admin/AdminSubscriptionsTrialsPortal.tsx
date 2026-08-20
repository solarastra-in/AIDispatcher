import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight, 
  Zap, 
  KeyRound, 
  AlertTriangle,
  Calendar,
  Lock,
  Search,
  Plus
} from 'lucide-react';
import { 
  UserTrialInfo, 
  loadAllUserTrialsFromFirestore, 
  saveUserTrialToFirestore,
  recordAuditLogToFirestore,
  auth
} from '../../lib/firebase';

interface AdminSubscriptionsTrialsPortalProps {
  onNotifyStatus?: (message: { type: 'success' | 'error' | 'info'; text: string }) => void;
}

export const AdminSubscriptionsTrialsPortal: React.FC<AdminSubscriptionsTrialsPortalProps> = ({ onNotifyStatus }) => {
  const [trials, setTrials] = useState<UserTrialInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchTrials = async () => {
    setIsLoading(true);
    try {
      const allTrials = await loadAllUserTrialsFromFirestore();
      setTrials(allTrials);
    } catch (e) {
      console.warn('Error loading user trials', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrials();
  }, []);

  const handleExtendTrial = async (user: UserTrialInfo, additionalDays: number = 7) => {
    setActionInProgress(user.uid);
    try {
      const now = new Date();
      const currentExpiry = new Date(user.trialExpiresAt);
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);
      
      const updated: UserTrialInfo = {
        ...user,
        trialExpiresAt: newExpiry.toISOString(),
        isTrialActive: true,
        daysRemaining: Math.max(1, user.daysRemaining + additionalDays),
      };

      await saveUserTrialToFirestore(updated);
      
      const adminEmail = auth.currentUser?.email || 'Admin Superuser';
      await recordAuditLogToFirestore(
        'Extended User Free Trial',
        'trial_management',
        adminEmail,
        `Extended 7-day trial for ${user.email} by ${additionalDays} days until ${newExpiry.toLocaleDateString()}.`
      );

      setTrials(prev => prev.map(t => t.uid === user.uid ? updated : t));
      if (onNotifyStatus) {
        onNotifyStatus({
          type: 'success',
          text: `Extended trial for ${user.email} by ${additionalDays} days.`
        });
      }
    } catch (e: any) {
      console.error(e);
      if (onNotifyStatus) {
        onNotifyStatus({
          type: 'error',
          text: `Failed to extend trial: ${e.message}`
        });
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConvertToPaid = async (user: UserTrialInfo) => {
    setActionInProgress(user.uid);
    try {
      const updated: UserTrialInfo = {
        ...user,
        isPaidPlan: true,
        planType: 'pro_developer',
        isTrialActive: false,
        dailyTokenLimit: 1000000, // 1M tokens/day
      };

      await saveUserTrialToFirestore(updated);

      const adminEmail = auth.currentUser?.email || 'Admin Superuser';
      await recordAuditLogToFirestore(
        'Converted User to Pro Plan',
        'subscription_management',
        adminEmail,
        `Upgraded ${user.email} to Pro Developer Plan with BYOK key requirement.`
      );

      setTrials(prev => prev.map(t => t.uid === user.uid ? updated : t));
      if (onNotifyStatus) {
        onNotifyStatus({
          type: 'success',
          text: `Converted ${user.email} to Pro Developer Plan.`
        });
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredTrials = trials.filter(t => 
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold font-display text-white">7-Day Free Trial & Subscriptions Portal</h2>
          </div>
          <p className="text-xs text-slate-400">
            Track 7-day free trial expirations, managed Claude/Gemini usage quotas, and enforce post-trial BYOK signups.
          </p>
        </div>

        <button
          onClick={fetchTrials}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-white/10 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
          <span>Refresh Trials</span>
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex items-center gap-3 bg-slate-950/70 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
        <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
        <input
          type="text"
          placeholder="Filter by user email, display name, or UID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
        />
        <span className="text-[11px] font-mono text-slate-400 px-3 shrink-0">
          Showing {filteredTrials.length} of {trials.length} users
        </span>
      </div>

      {/* TRIALS TABLE */}
      <div className="bg-slate-900/70 border border-white/10 rounded-3xl backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/50 text-slate-400 font-mono text-[11px]">
                <th className="p-4">User & Account</th>
                <th className="p-4">Trial / Plan Status</th>
                <th className="p-4">7-Day Countdown</th>
                <th className="p-4">Daily Usage (Tokens)</th>
                <th className="p-4">BYOK Keys</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredTrials.map((u) => {
                const isExpired = !u.isTrialActive && !u.isPaidPlan;
                const isPro = u.isPaidPlan;
                const isActiveTrial = u.isTrialActive && !u.isPaidPlan;

                return (
                  <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                    
                    {/* User Info */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{u.displayName || 'Developer User'}</span>
                          {u.email === 'solarastra.in@gmail.com' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              SUPERADMIN
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">{u.email}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Joined: {new Date(u.trialStartedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      {isPro ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                          <Zap className="w-3 h-3 text-purple-400" />
                          Pro Developer Plan
                        </span>
                      ) : isActiveTrial ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 uppercase">
                          <Clock className="w-3 h-3 text-orange-400" />
                          7-Day Free Trial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40 uppercase">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          Trial Expired · BYOK Needed
                        </span>
                      )}
                    </td>

                    {/* Countdown */}
                    <td className="p-4 font-mono text-[11px]">
                      {isPro ? (
                        <span className="text-purple-300">Unlimited Active</span>
                      ) : isActiveTrial ? (
                        <div className="space-y-1">
                          <div className="text-white font-bold">
                            Day {7 - u.daysRemaining + 1} of 7 ({u.daysRemaining}d left)
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Expires {new Date(u.trialExpiresAt).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-red-400 font-semibold">Concluded (0d left)</span>
                      )}
                    </td>

                    {/* Usage */}
                    <td className="p-4 font-mono text-[11px]">
                      <div className="space-y-1">
                        <div className="text-slate-200">
                          {u.dailyTokensUsed.toLocaleString()} / {u.dailyTokenLimit.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {u.totalDispatches} dispatches total
                        </div>
                      </div>
                    </td>

                    {/* BYOK Status */}
                    <td className="p-4">
                      {u.isByokConfigured ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400">
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          Pending BYOK
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleExtendTrial(u, 7)}
                          disabled={actionInProgress === u.uid}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 text-[11px] font-mono border border-white/10 transition-colors cursor-pointer"
                          title="Add 7 more days to free trial"
                        >
                          +7d Trial
                        </button>
                        {!u.isPaidPlan && (
                          <button
                            onClick={() => handleConvertToPaid(u)}
                            disabled={actionInProgress === u.uid}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-mono font-semibold transition-colors cursor-pointer"
                            title="Convert to Pro Developer"
                          >
                            Upgrade Pro
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
