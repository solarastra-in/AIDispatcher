import { useEffect, useState } from "react";
import { authedFetch } from "../lib/firebaseClient";
import { Server, CheckCircle2, AlertTriangle, HelpCircle, Activity, TrendingDown, DollarSign } from "lucide-react";

interface SelfHostResult {
  verdict: "self_host_viable" | "api_cheaper_at_current_volume" | "capability_gap_too_large" | "insufficient_data";
  reasoning: string[];
  capabilityCoveragePercent: number;
  monthlyTokenVolume: number;
  currentMonthlyApiSpendUsd: number;
  projectedSelfHostMonthlyCostUsd: { low: number; high: number };
  projectedSelfHostCostPerMillionTokens: number;
  breakEvenAnalysis: string;
  periodDaysAnalyzed: number;
  dataSource: string;
  archetypesWithNoSeedData: string[];
}

const VERDICT_META: Record<
  SelfHostResult["verdict"],
  { label: string; badgeClass: string; icon: any }
> = {
  self_host_viable: {
    label: "Self-Hosting Viable & Cost-Effective",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
  },
  api_cheaper_at_current_volume: {
    label: "API Routing Cheaper at Current Volume",
    badgeClass: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    icon: DollarSign,
  },
  capability_gap_too_large: {
    label: "Frontier Models Required (Capability Gap)",
    badgeClass: "bg-orange-500/10 text-orange-300 border-orange-500/30",
    icon: AlertTriangle,
  },
  insufficient_data: {
    label: "Insufficient Traffic Sample",
    badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
    icon: HelpCircle,
  },
};

export default function SelfHostAnalysisPanel({ companyId }: { companyId: string }) {
  const [result, setResult] = useState<SelfHostResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    authedFetch(`/api/company/${companyId}/self-host-analysis`)
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) {
    return (
      <div className="p-6 bg-slate-900/60 border border-white/10 rounded-2xl text-xs text-slate-400 font-mono flex items-center gap-2">
        <Server className="w-4 h-4 animate-spin text-orange-400" />
        <span>Evaluating hardware economics & open-weights coverage…</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6 bg-slate-900/60 border border-white/10 rounded-2xl text-xs text-slate-500 font-mono">
        Self-hosting viability assessment is currently not available for this organization.
      </div>
    );
  }

  const meta = VERDICT_META[result.verdict] || VERDICT_META.insufficient_data;
  const VerdictIcon = meta.icon;

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-orange-400" />
          <h3 className="text-sm font-bold text-slate-100">
            Open-Weights Self-Hosting Viability Matrix
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${meta.badgeClass}`}
        >
          <VerdictIcon className="w-3.5 h-3.5" />
          {meta.label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {result.capabilityCoveragePercent ?? 0}%
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Open Weights Task Coverage</div>
        </div>
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold font-mono text-orange-400">
            {((result.monthlyTokenVolume || 0) / 1_000_000).toFixed(1)}M
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Monthly Token Volume</div>
        </div>
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-center">
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ${(result.currentMonthlyApiSpendUsd || 0).toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Current Monthly Spend</div>
        </div>
      </div>

      {result.reasoning && result.reasoning.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Key Economic Drivers:</p>
          <ul className="space-y-1 text-xs text-slate-300">
            {result.reasoning.map((r, i) => (
              <li key={i} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-orange-400 font-bold">›</span>
                <span className="leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.breakEvenAnalysis && (
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{result.breakEvenAnalysis}</span>
        </div>
      )}
    </div>
  );
}
