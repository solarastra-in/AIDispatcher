import { useEffect, useState } from "react";
import { authedFetch } from "../lib/firebaseClient";

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

const VERDICT_LABEL: Record<SelfHostResult["verdict"], { label: string; color: string }> = {
  self_host_viable: { label: "Self-hosting worth piloting", color: "#4FD1C5" },
  api_cheaper_at_current_volume: { label: "API remains cheaper", color: "#93999F" },
  capability_gap_too_large: { label: "Open models fall short", color: "#FF8A3D" },
  insufficient_data: { label: "Not enough data yet", color: "#5B6169" },
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

  if (loading) return <div className="text-xs text-[#93999F]">Analyzing usage history…</div>;
  if (!result) return <div className="text-xs text-red-400">Analysis unavailable.</div>;

  const verdictMeta = VERDICT_LABEL[result.verdict] || VERDICT_LABEL.insufficient_data;

  return (
    <div className="border border-[#2A2F38] rounded bg-[#171B21] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Self-hosting viability</h3>
        <span className="text-[11px] font-mono px-2 py-1 rounded" style={{ color: verdictMeta.color, backgroundColor: `${verdictMeta.color}15` }}>
          {verdictMeta.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div>
          <div className="text-lg font-mono">{result.capabilityCoveragePercent ?? 0}%</div>
          <div className="text-[10px] text-[#93999F]">capability coverage</div>
        </div>
        <div>
          <div className="text-lg font-mono">{((result.monthlyTokenVolume || 0) / 1_000_000).toFixed(1)}M</div>
          <div className="text-[10px] text-[#93999F]">tokens/month</div>
        </div>
        <div>
          <div className="text-lg font-mono">${result.currentMonthlyApiSpendUsd ?? 0}</div>
          <div className="text-[10px] text-[#93999F]">current API spend</div>
        </div>
      </div>

      <p className="text-xs text-[#93999F] mb-3">{result.reasoning?.join(" ")}</p>
      <p className="text-[11px] text-[#5B6169] mb-3">{result.breakEvenAnalysis}</p>

      {result.archetypesWithNoSeedData?.length > 0 && (
        <p className="text-[11px] text-[#FF8A3D] mb-2">
          No capability data yet for: {result.archetypesWithNoSeedData.join(", ")} — these count against coverage until assessed.
        </p>
      )}

      <p className="text-[10px] text-[#5B6169] font-mono border-t border-[#2A2F38] pt-2 mt-2">
        Based on {result.periodDaysAnalyzed} days of usage · open-model capability data: {result.dataSource} (admin-entered)
      </p>
    </div>
  );
}
