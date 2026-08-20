import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Sliders, 
  AlertCircle,
  Zap,
  TrendingDown,
  Info
} from 'lucide-react';
import { 
  AdminKeyConfig, 
  loadAdminKeyConfigsFromFirestore, 
  saveAdminKeyConfigToFirestore,
  recordAuditLogToFirestore,
  auth
} from '../../lib/firebase';

interface AdminKeysAndBudgetsPortalProps {
  onNotifyStatus?: (message: { type: 'success' | 'error' | 'info'; text: string }) => void;
}

export const AdminKeysAndBudgetsPortal: React.FC<AdminKeysAndBudgetsPortalProps> = ({ onNotifyStatus }) => {
  const [keys, setKeys] = useState<AdminKeyConfig[]>([]);
  const [visibleKeyIds, setVisibleKeyIds] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const cloudKeys = await loadAdminKeyConfigsFromFirestore();
      setKeys(cloudKeys);
    } catch (e) {
      console.warn('Error loading admin keys', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleUpdateKey = (id: string, updates: Partial<AdminKeyConfig>) => {
    setKeys(prev => prev.map(k => {
      if (k.id !== id) return k;
      const updated = { ...k, ...updates };

      // Recalculate over-budget and over-day-usage flags dynamically
      const isBudgetOver = updated.monthlyBudgetLimit > 0 && updated.currentSpend >= updated.monthlyBudgetLimit;
      const isDayUsageOver = updated.dailyUsageLimit > 0 && updated.todaySpend >= updated.dailyUsageLimit;

      return {
        ...updated,
        isBudgetOver,
        isDayUsageOver,
        lastUpdated: new Date().toISOString()
      };
    }));
  };

  const handleSaveAllKeys = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      for (const k of keys) {
        await saveAdminKeyConfigToFirestore(k);
      }
      
      const adminEmail = auth.currentUser?.email || 'Admin Superuser';
      await recordAuditLogToFirestore(
        'Updated AI Engine Keys & Budgets',
        'key_management',
        adminEmail,
        `Updated credentials, monthly budgets and daily usage caps for ${keys.length} AI providers.`
      );

      setStatusMessage({
        type: 'success',
        text: 'All AI engine API keys, monthly budget caps, and daily rate limits saved to Firestore successfully.'
      });
      if (onNotifyStatus) {
        onNotifyStatus({
          type: 'success',
          text: 'AI Keys & Budget policies updated successfully.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to save keys: ${err.message}`
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeyIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Find any keys with overages
  const overBudgetKeys = keys.filter(k => k.isBudgetOver);
  const overDayUsageKeys = keys.filter(k => k.isDayUsageOver);
  const hasAnyOverages = overBudgetKeys.length > 0 || overDayUsageKeys.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold font-display text-white">AI Engine Keys & Budget Limits Portal</h2>
          </div>
          <p className="text-xs text-slate-400">
            Configure enterprise and admin subscription pool keys with monthly spending limits and daily usage guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchKeys}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleSaveAllKeys}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving to Firestore...' : 'Save All Keys & Budgets'}</span>
          </button>
        </div>
      </div>

      {/* GLOBAL OVERAGE WARNING BANNER IF ANY KEY EXCEEDED */}
      {hasAnyOverages && (
        <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/40 text-red-300 backdrop-blur-xl space-y-2 animate-in fade-in shadow-xl">
          <div className="flex items-center gap-2 font-bold text-sm text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>API Engine Spend Alert: Budget or Daily Usage Exceeded!</span>
          </div>
          <div className="text-xs space-y-1 text-red-200/90 pl-7">
            {overBudgetKeys.map(k => (
              <div key={k.id}>
                • <strong className="text-white">{k.providerName}</strong> has exceeded its monthly budget: 
                <span className="font-mono text-red-300 font-bold ml-1">${k.currentSpend.toFixed(2)} / ${k.monthlyBudgetLimit.toFixed(2)}</span>. Traﬃc is automatically throttled or routed to backup providers.
              </div>
            ))}
            {overDayUsageKeys.map(k => (
              <div key={k.id}>
                • <strong className="text-white">{k.providerName}</strong> has exceeded its daily usage cap: 
                <span className="font-mono text-amber-300 font-bold ml-1">${k.todaySpend.toFixed(2)} / ${k.dailyUsageLimit.toFixed(2)}</span> for today.
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATUS NOTIFICATION */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
          statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
          statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
          'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* KEY CONFIGURATION CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {keys.map((k) => {
          const isVisible = visibleKeyIds[k.id] || false;
          const budgetPct = k.monthlyBudgetLimit > 0 ? Math.min(100, Math.round((k.currentSpend / k.monthlyBudgetLimit) * 100)) : 0;
          const dailyPct = k.dailyUsageLimit > 0 ? Math.min(100, Math.round((k.todaySpend / k.dailyUsageLimit) * 100)) : 0;

          return (
            <div 
              key={k.id}
              className={`p-6 rounded-3xl border backdrop-blur-xl transition-all space-y-5 relative ${
                k.isBudgetOver 
                  ? 'bg-red-950/20 border-red-500/60 shadow-lg shadow-red-500/10' 
                  : k.isDayUsageOver
                  ? 'bg-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/70 border-white/10 hover:border-white/20 shadow-xl'
              }`}
            >
              
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{k.providerName}</h3>
                    <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-white/10">
                      {k.modelFamily}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Primary Engine for {k.modelFamily} requests & Pareto sampling
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col items-end gap-1.5">
                  {k.isBudgetOver && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/50 uppercase animate-pulse">
                      Over Budget Limit
                    </span>
                  )}
                  {k.isDayUsageOver && !k.isBudgetOver && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 uppercase">
                      Over Daily Limit
                    </span>
                  )}
                  {!k.isBudgetOver && !k.isDayUsageOver && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active & Within Limits
                    </span>
                  )}
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-semibold flex items-center justify-between">
                  <span>API Secret Key ({k.envVarName})</span>
                  <button
                    type="button"
                    onClick={() => toggleVisibility(k.id)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-mono"
                  >
                    {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{isVisible ? 'Hide' : 'Reveal'}</span>
                  </button>
                </label>
                <input
                  type={isVisible ? 'text' : 'password'}
                  placeholder={`Enter ${k.providerName} API Key (e.g. sk-...)`}
                  value={k.apiKey}
                  onChange={(e) => handleUpdateKey(k.id, { apiKey: e.target.value })}
                  className="w-full rounded-xl bg-slate-950/80 border border-white/15 px-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Budget & Daily Usage Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                
                {/* Monthly Budget Cap */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Monthly Budget Cap ($)</span>
                    <span className="font-mono font-bold text-white">${k.monthlyBudgetLimit}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={k.monthlyBudgetLimit}
                    onChange={(e) => handleUpdateKey(k.id, { monthlyBudgetLimit: Number(e.target.value) || 0 })}
                    className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Spend: ${k.currentSpend.toFixed(2)}</span>
                      <span className={k.isBudgetOver ? 'text-red-400 font-bold' : 'text-slate-300'}>{budgetPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${k.isBudgetOver ? 'bg-red-500' : 'bg-orange-500'}`} 
                        style={{ width: `${budgetPct}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Daily Usage Limit */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Daily Limit Cap ($/day)</span>
                    <span className="font-mono font-bold text-white">${k.dailyUsageLimit}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={k.dailyUsageLimit}
                    onChange={(e) => handleUpdateKey(k.id, { dailyUsageLimit: Number(e.target.value) || 0 })}
                    className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Today: ${k.todaySpend.toFixed(2)}</span>
                      <span className={k.isDayUsageOver ? 'text-amber-400 font-bold' : 'text-slate-300'}>{dailyPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${k.isDayUsageOver ? 'bg-amber-500' : 'bg-cyan-500'}`} 
                        style={{ width: `${dailyPct}%` }} 
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Toggle */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={k.isActive}
                    onChange={(e) => handleUpdateKey(k.id, { isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 bg-slate-950 border-white/20 focus:ring-orange-500"
                  />
                  <span className="text-slate-300">Enable in Auto-Dispatch Pool</span>
                </label>

                <span className="text-[10px] text-slate-500 font-mono">
                  Updated: {new Date(k.lastUpdated).toLocaleDateString()}
                </span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
