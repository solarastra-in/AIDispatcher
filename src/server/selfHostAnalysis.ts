export const CITED_BENCHMARKS = {
  source: "GMI Cloud, packet.ai, Ginger Labs, Spheron — GPU/inference pricing surveys, 2026",
  h100OnDemandPerHour: 2.50,
  a100SpotPerHour: 0.08,
  llama70bTokensPerSecBatch8H100: 380,
  llama70bCostPerMillionOutputTokens: 0.18,
  typicalProductionUtilization: 0.40,
  bareMetalDualH100MonthlyLow: 4000,
  bareMetalDualH100MonthlyHigh: 10000,
  breakEvenTokensPerMonthLow: 1_000_000_000,
  breakEvenTokensPerMonthHigh: 5_000_000_000,
};

export interface ArchetypeUsage {
  archetypeId: string;
  requestCount: number;
  totalTokens: number;
  currentSpendUsd: number;
  currentAvgQualityMet: boolean;
}

export interface OpenModelCapabilityCheck {
  archetypeId: string;
  bestOpenModelId: string | null;
  bestOpenModelQualityEstimate: number | null;
  meetsCurrentBar: boolean;
}

export interface SelfHostRecommendation {
  verdict: "self_host_viable" | "api_cheaper_at_current_volume" | "capability_gap_too_large" | "insufficient_data";
  reasoning: string[];
  capabilityCoveragePercent: number;
  monthlyTokenVolume: number;
  currentMonthlyApiSpendUsd: number;
  projectedSelfHostMonthlyCostUsd: { low: number; high: number };
  projectedSelfHostCostPerMillionTokens: number;
  breakEvenAnalysis: string;
}

export function analyzeSelfHostViability(
  archetypeUsage: ArchetypeUsage[],
  openModelChecks: OpenModelCapabilityCheck[],
  periodDays: number
): SelfHostRecommendation {
  if (archetypeUsage.length === 0) {
    return {
      verdict: "insufficient_data",
      reasoning: ["No usage history in the analyzed period — need at least a few weeks of real traffic to make this call."],
      capabilityCoveragePercent: 0, monthlyTokenVolume: 0, currentMonthlyApiSpendUsd: 0,
      projectedSelfHostMonthlyCostUsd: { low: 0, high: 0 }, projectedSelfHostCostPerMillionTokens: 0,
      breakEvenAnalysis: "",
    };
  }

  const totalRequests = archetypeUsage.reduce((s, a) => s + a.requestCount, 0);
  const totalTokens = archetypeUsage.reduce((s, a) => s + a.totalTokens, 0);
  const totalSpend = archetypeUsage.reduce((s, a) => s + a.currentSpendUsd, 0);
  const monthlyMultiplier = 30 / periodDays;
  const monthlyTokenVolume = Math.round(totalTokens * monthlyMultiplier);
  const currentMonthlyApiSpendUsd = Math.round(totalSpend * monthlyMultiplier * 100) / 100;

  const checksByArchetype = new Map(openModelChecks.map((c) => [c.archetypeId, c]));
  let coveredRequests = 0;
  for (const usage of archetypeUsage) {
    const check = checksByArchetype.get(usage.archetypeId);
    if (check?.meetsCurrentBar) coveredRequests += usage.requestCount;
  }
  const capabilityCoveragePercent = Math.round((coveredRequests / totalRequests) * 1000) / 10;

  const costPerMillionAtRealUtilization = Math.round(
    (CITED_BENCHMARKS.llama70bCostPerMillionOutputTokens / CITED_BENCHMARKS.typicalProductionUtilization) * 100
  ) / 100;
  const singleGpuMonthlyCost = CITED_BENCHMARKS.h100OnDemandPerHour * 24 * 30;
  const projectedSelfHostMonthlyCostUsd = {
    low: Math.round(singleGpuMonthlyCost),
    high: CITED_BENCHMARKS.bareMetalDualH100MonthlyHigh,
  };

  const reasoning: string[] = [];
  let verdict: SelfHostRecommendation["verdict"];

  if (capabilityCoveragePercent < 60) {
    verdict = "capability_gap_too_large";
    reasoning.push(
      `Only ${capabilityCoveragePercent}% of your request volume is currently handled well by open-weight models in the catalog — ` +
      `the rest needs frontier-tier reasoning open models aren't matching yet. Self-hosting would mean either a real quality drop ` +
      `on the majority of your traffic, or keeping API access for that traffic anyway — which erases most of the savings.`
    );
  } else if (monthlyTokenVolume < CITED_BENCHMARKS.breakEvenTokensPerMonthLow) {
    verdict = "api_cheaper_at_current_volume";
    reasoning.push(
      `Your current volume (~${(monthlyTokenVolume / 1_000_000).toFixed(0)}M tokens/month) is well below the ` +
      `~${(CITED_BENCHMARKS.breakEvenTokensPerMonthLow / 1_000_000_000).toFixed(1)}B tokens/month where industry benchmarks ` +
      `show self-hosting starting to break even against API pricing. At this volume, a dedicated GPU sits mostly idle between ` +
      `requests, and idle GPU-hours are the single biggest cost driver in self-hosted inference.`
    );
  } else {
    verdict = "self_host_viable";
    reasoning.push(
      `Capability coverage (${capabilityCoveragePercent}%) and volume (~${(monthlyTokenVolume / 1_000_000_000).toFixed(2)}B tokens/month) ` +
      `both clear the threshold where self-hosting is worth a real pilot — see the architecture reference for what building this looks like.`
    );
  }

  const breakEvenAnalysis =
    `At the cited $${CITED_BENCHMARKS.llama70bCostPerMillionOutputTokens}/M-token peak-throughput rate (H100, batch=8, ` +
    `vLLM/FP16), adjusted for typical production utilization (${CITED_BENCHMARKS.typicalProductionUtilization * 100}%, ` +
    `not the saturated-batch benchmark number), real-world self-hosted cost lands around $${costPerMillionAtRealUtilization}/M ` +
    `tokens. Compare this to your actual current $/M token rate before deciding — this figure assumes an open-weight model ` +
    `at capability parity with what you're using today, which the capability check above determines, not this cost math.`;

  return {
    verdict, reasoning, capabilityCoveragePercent, monthlyTokenVolume, currentMonthlyApiSpendUsd,
    projectedSelfHostMonthlyCostUsd, projectedSelfHostCostPerMillionTokens: costPerMillionAtRealUtilization,
    breakEvenAnalysis,
  };
}
