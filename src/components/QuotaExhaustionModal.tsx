import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  Key,
  ShieldCheck,
  Zap,
  ArrowRight,
  X,
  RefreshCw,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

export type ExhaustionType = 'daily_trial_exhausted' | 'provider_quota_exhausted' | 'budget_exceeded' | 'auth_required';

export interface QuotaExhaustionData {
  errorType: ExhaustionType;
  title?: string;
  providerName?: string;
  modelName?: string;
  businessMessage?: string;
  recommendation?: string;
  resetTime?: string;
  currentUsageTokens?: number;
  dailyLimitTokens?: number;
  suggestedFallbackModel?: string;
}

export interface QuotaExhaustionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: QuotaExhaustionData | null;
  onNavigateToCredentials?: () => void;
  onNavigateToPricing?: () => void;
  onSelectAlternativeModel?: (modelId: string) => void;
}

export const QuotaExhaustionModal: React.FC<QuotaExhaustionModalProps> = ({
  isOpen,
  onClose,
  data,
  onNavigateToCredentials,
  onNavigateToPricing,
  onSelectAlternativeModel,
}) => {
  if (!isOpen || !data) return null;

  const isDailyTrial = data.errorType === 'daily_trial_exhausted';
  const isProviderQuota = data.errorType === 'provider_quota_exhausted';
  const isBudget = data.errorType === 'budget_exceeded';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/70 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            isDailyTrial
              ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/0'
              : isProviderQuota
              ? 'bg-gradient-to-br from-indigo-500/20 to-cyan-500/0'
              : 'bg-gradient-to-br from-rose-500/20 to-amber-500/0'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge & Header */}
        <div className="space-y-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${
              isDailyTrial
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : isProviderQuota
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}
          >
            {isDailyTrial ? (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Complimentary Allocation Refreshes Daily</span>
              </>
            ) : isProviderQuota ? (
              <>
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Provider Rate Limit Reached</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Spend Guardrail Engaged</span>
              </>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            {data.title ||
              (isDailyTrial
                ? "Today's Free Trial Quota Reached"
                : isProviderQuota
                ? `${data.providerName || 'Provider'} Quota Exhausted`
                : 'Monthly Spend Guardrail Reached')}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {data.businessMessage ||
              (isDailyTrial
                ? "You have utilized today's allocated free trial token quota. Your daily allocation will automatically refresh tomorrow at 00:00 UTC."
                : `The upstream provider quota for ${data.providerName || 'this engine'} is currently exhausted.`)}
          </p>
        </div>

        {/* Business Friendly Solution Card */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Recommended Next Steps:</span>
          </div>

          {isDailyTrial && (
            <div className="space-y-2 text-slate-300 font-sans text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Option 1: Link Your Own Subscription / API Key</strong>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Connect your ChatGPT Pro, Claude Pro, or Gemini Advanced flat subscription or BYOK API key in Company Settings for uninterrupted zero-token surcharge routing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Option 2: Check Back Tomorrow</strong>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Your complimentary 100,000 daily tokens will automatically reload at <strong>00:00 UTC</strong> tomorrow.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isProviderQuota && (
            <div className="space-y-2 text-slate-300 font-sans text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Automatic Model Fallback</strong>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    WhyOr can seamlessly route this prompt to an available high-speed frontier model (e.g. Gemini 2.5 Flash or Claude 3.5 Sonnet) with zero downtime.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Update Provider Key or Plan</strong>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Increase rate limits in your {data.providerName || 'upstream'} provider dashboard or link a flat-rate subscription account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isBudget && (
            <div className="space-y-2 text-slate-300 font-sans text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Team Spend Limit Reached</strong>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Organization spend has reached the configured monthly budget limit. Adjust the limit in Admin Settings or switch models to flat-rate subscriptions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Primary Action 1: BYOK / Credentials */}
          <button
            onClick={() => {
              onClose();
              onNavigateToCredentials?.();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Connect Subscription or BYOK API Key</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Secondary Action: Fallback / Upgrade / Check Back */}
          <div className="grid grid-cols-2 gap-2">
            {isProviderQuota && data.suggestedFallbackModel ? (
              <button
                onClick={() => {
                  onSelectAlternativeModel?.(data.suggestedFallbackModel!);
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Auto-Route Alternate</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToPricing?.();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Upgrade Plan</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all border border-slate-800 cursor-pointer"
            >
              <span>Check Back Tomorrow</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
