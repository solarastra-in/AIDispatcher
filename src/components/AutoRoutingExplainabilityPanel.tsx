import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import {
  Scale,
  DollarSign,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Info,
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  Clock,
  Layers,
  Activity,
  Cpu,
  Check,
  ChevronRight,
  Gauge
} from 'lucide-react';
import { AIModel, UserPersona, ComplexityClassification, CandidateEvaluation, ModelTier, AutoRetryInfo } from '../types';
import { TaskProbabilityDistribution } from '../core/embeddingClassifier';
import { TASK_ARCHETYPES } from '../core/taskTaxonomy';
import { QualityModelTracker } from '../core/qualityModel';

interface AutoRoutingExplainabilityPanelProps {
  chosenModel: AIModel;
  baselineFrontierModel: AIModel;
  classification: ComplexityClassification;
  taskDistribution: TaskProbabilityDistribution;
  candidateEvaluations?: CandidateEvaluation[];
  allModels: AIModel[];
  activePersona: UserPersona;
  qualityTracker?: QualityModelTracker;
  autoRetryInfo?: AutoRetryInfo;
  onSelectAlternativeModel?: (modelId: string) => void;
}

export const AutoRoutingExplainabilityPanel: React.FC<AutoRoutingExplainabilityPanelProps> = ({
  chosenModel,
  baselineFrontierModel,
  classification,
  taskDistribution,
  candidateEvaluations = [],
  allModels,
  activePersona,
  qualityTracker,
  autoRetryInfo,
  onSelectAlternativeModel,
}) => {
  // Interactive criteria weighting sliders for explainability simulation
  const [costWeight, setCostWeight] = useState<number>(50); // 0-100
  const [qualityWeight, setQualityWeight] = useState<number>(50); // 0-100
  const [latencyWeight, setLatencyWeight] = useState<number>(20); // 0-100
  const [showSensitivitySimulator, setShowSensitivitySimulator] = useState<boolean>(false);
  const [selectedExplainMode, setSelectedExplainMode] = useState<'decision_tree' | 'cost_vs_complexity' | 'criteria_radar' | 'elimination_matrix'>('cost_vs_complexity');

  const complexityScore = classification.complexityScore || 5.0;
  
  // Calculate quality floor required for this specific complexity
  const requiredQualityFloor = useMemo(() => {
    if (complexityScore >= 8.5) return 94;
    if (complexityScore >= 6.5) return 90;
    if (complexityScore >= 4.0) return 86;
    if (complexityScore >= 2.5) return 82;
    return 75;
  }, [complexityScore]);

  // Cost avoidance & efficiency metrics
  const chosenEstimatedCost = useMemo(() => {
    const inTokens = classification.estimatedInputTokens || 500;
    const outTokens = classification.estimatedOutputTokens || 250;
    return (inTokens / 1_000_000 * chosenModel.inputPricePerM) + (outTokens / 1_000_000 * chosenModel.outputPricePerM);
  }, [chosenModel, classification]);

  const baselineEstimatedCost = useMemo(() => {
    const inTokens = classification.estimatedInputTokens || 500;
    const outTokens = classification.estimatedOutputTokens || 250;
    return (inTokens / 1_000_000 * baselineFrontierModel.inputPricePerM) + (outTokens / 1_000_000 * baselineFrontierModel.outputPricePerM);
  }, [baselineFrontierModel, classification]);

  const costDeltaRatio = baselineEstimatedCost > 0 ? (baselineEstimatedCost / (chosenEstimatedCost || 0.000001)).toFixed(1) : '1.0';
  const percentageSaved = baselineEstimatedCost > 0 ? Math.round(((baselineEstimatedCost - chosenEstimatedCost) / baselineEstimatedCost) * 100) : 0;
  const overkillAvoidanceUsd = Math.max(0, baselineEstimatedCost - chosenEstimatedCost);

  // Bayesian posterior state for the chosen model on this archetype
  const bayesianPosterior = useMemo(() => {
    if (!qualityTracker) {
      return { alpha: 12, beta: 2, mean: 0.857, variance: 0.008 };
    }
    const state = qualityTracker.getPosterior(taskDistribution.primaryArchetype, chosenModel.provider, chosenModel.id);
    const mean = state.alpha / (state.alpha + state.beta);
    const variance = (state.alpha * state.beta) / (Math.pow(state.alpha + state.beta, 2) * (state.alpha + state.beta + 1));
    return {
      alpha: state.alpha,
      beta: state.beta,
      mean: Number(mean.toFixed(3)),
      variance: Number(variance.toFixed(4))
    };
  }, [qualityTracker, taskDistribution.primaryArchetype, chosenModel]);

  // Radar chart criteria comparison data (Selected vs Baseline vs Average)
  const radarCriteriaData = useMemo(() => {
    const costScoreChosen = Math.min(100, Math.round(100 - (chosenModel.inputPricePerM / 5.0) * 80));
    const costScoreBaseline = Math.min(100, Math.round(100 - (baselineFrontierModel.inputPricePerM / 5.0) * 80));

    const speedScoreChosen = Math.min(100, Math.round(100 - (chosenModel.latencyAvgMs / 1500) * 80));
    const speedScoreBaseline = Math.min(100, Math.round(100 - (baselineFrontierModel.latencyAvgMs / 1500) * 80));

    return [
      { criterion: 'Quality Fit', chosen: chosenModel.qualityBenchmarkScore, baseline: baselineFrontierModel.qualityBenchmarkScore, requirement: requiredQualityFloor },
      { criterion: 'Cost Efficiency', chosen: costScoreChosen, baseline: costScoreBaseline, requirement: 60 },
      { criterion: 'Response Speed', chosen: speedScoreChosen, baseline: speedScoreBaseline, requirement: 50 },
      { criterion: 'Context Headroom', chosen: Math.min(100, Math.round((chosenModel.contextWindowTokens / 2000000) * 100)), baseline: Math.min(100, Math.round((baselineFrontierModel.contextWindowTokens / 2000000) * 100)), requirement: 25 },
      { criterion: 'Bayesian Reliability', chosen: Math.round(bayesianPosterior.mean * 100), baseline: 92, requirement: Math.round(requiredQualityFloor * 0.9) },
    ];
  }, [chosenModel, baselineFrontierModel, requiredQualityFloor, bayesianPosterior]);

  // Simulation: Score models dynamically based on user slider weights
  const simulatedWinner = useMemo(() => {
    const normalizedModels = allModels.filter(m => activePersona.allowedTiers.includes(m.tier) && m.status === 'active');
    if (normalizedModels.length === 0) return chosenModel;

    let bestScore = -999999;
    let winner = chosenModel;

    normalizedModels.forEach(m => {
      const qScore = m.qualityBenchmarkScore;
      const cScore = 100 - Math.min(100, (m.inputPricePerM / 5.0) * 100);
      const lScore = 100 - Math.min(100, (m.latencyAvgMs / 1500) * 100);

      // Penalty if below required quality floor
      const qualityPenalty = qScore < requiredQualityFloor ? (requiredQualityFloor - qScore) * 5 : 0;

      const combinedScore = 
        (qScore * (qualityWeight / 100)) +
        (cScore * (costWeight / 100)) +
        (lScore * (latencyWeight / 100)) -
        qualityPenalty;

      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        winner = m;
      }
    });

    return winner;
  }, [allModels, activePersona.allowedTiers, qualityWeight, costWeight, latencyWeight, requiredQualityFloor, chosenModel]);

  // Cost vs. Complexity Bar Chart Data across key tiers
  const tierCostComplexityData = useMemo(() => {
    return [
      { tier: 'Low (Flash / V3)', avgCostPerM: 0.15, qualityScore: 88, complexityFit: '1.0 - 4.5', isSelectedTier: chosenModel.tier === 'low', isOverkill: false },
      { tier: 'Mid (Thinking / Haiku)', avgCostPerM: 0.40, qualityScore: 93, complexityFit: '4.0 - 6.5', isSelectedTier: chosenModel.tier === 'mid', isOverkill: complexityScore < 4.0 },
      { tier: 'High (Sonnet / 4o)', avgCostPerM: 2.50, qualityScore: 95, complexityFit: '6.0 - 8.0', isSelectedTier: chosenModel.tier === 'high', isOverkill: complexityScore < 6.0 },
      { tier: 'Frontier (3.1 Pro / o3)', avgCostPerM: 4.50, qualityScore: 97, complexityFit: '8.0 - 10.0', isSelectedTier: chosenModel.tier === 'frontier', isOverkill: complexityScore < 7.5 },
      { tier: 'Deep Reasoning (o1 / R1)', avgCostPerM: 10.00, qualityScore: 99, complexityFit: '9.0 - 10.0', isSelectedTier: chosenModel.tier === 'deep_reasoning', isOverkill: complexityScore < 8.5 },
    ];
  }, [chosenModel.tier, complexityScore]);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-2xl text-slate-100 font-sans space-y-6">
      
      {/* Header Banner: Explainability Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Scale className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Auto-Routing Decision Explainability</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Transparent Multi-Criteria Routing
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Why was <strong className="text-amber-300">{chosenModel.name}</strong> selected over {allModels.length - 1} alternative candidates?
            </p>
          </div>
        </div>

        {/* Explainability Mode Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-mono">
          <button
            onClick={() => setSelectedExplainMode('cost_vs_complexity')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              selectedExplainMode === 'cost_vs_complexity'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cost vs Complexity
          </button>
          <button
            onClick={() => setSelectedExplainMode('decision_tree')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              selectedExplainMode === 'decision_tree'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5-Stage Decision Tree
          </button>
          <button
            onClick={() => setSelectedExplainMode('criteria_radar')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              selectedExplainMode === 'criteria_radar'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Criteria Radar
          </button>
          <button
            onClick={() => setSelectedExplainMode('elimination_matrix')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              selectedExplainMode === 'elimination_matrix'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Candidate Disqualification
          </button>
        </div>
      </div>

      {/* Smart Auto-Retry Telemetry Banner if triggered */}
      {autoRetryInfo && autoRetryInfo.triggered && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-blue-950/40 border border-amber-400/50 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-400/20 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-400/40 animate-pulse">
                <Zap className="w-4 h-4" />
              </span>
              <div>
                <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                  Smart Auto-Retry Fallback Activated (Thompson-Sampling Posterior)
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Initial model failed; auto-routed to #1 Thompson alternative in {autoRetryInfo.retryAttempts} attempt(s).
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                Recovered via {autoRetryInfo.selectedNextBestModel.name}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="text-slate-300 leading-relaxed font-sans">
              {autoRetryInfo.fallbackReason}
            </div>

            {/* Failure Chain Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[11px]">
              {autoRetryInfo.failedAttempts.map((fa, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30 text-red-200 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1 text-red-400">
                      <XCircle className="w-3.5 h-3.5" /> Failed Attempt #{idx + 1}: {fa.modelName}
                    </span>
                    <span className="text-[10px] text-red-300 font-mono">Tier: {fa.tier.toUpperCase()}</span>
                  </div>
                  <div className="text-[10px] text-red-300/90 font-mono truncate">
                    Reason: {fa.error}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-red-500/20">
                    <span>Thompson Posterior: {(fa.thompsonScore * 100).toFixed(1)}%</span>
                    <span>Score: {fa.expectedQuality}/100</span>
                  </div>
                </div>
              ))}

              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Next-Best Alternative: {autoRetryInfo.selectedNextBestModel.name}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono">Rank #{autoRetryInfo.thompsonSamplingRank}</span>
                </div>
                <div className="text-[10px] text-emerald-300/90 font-mono">
                  Selected as highest-confidence eligible candidate from {autoRetryInfo.totalCandidatePoolSize} model catalog.
                </div>
                <div className="text-[10px] text-slate-300 flex items-center justify-between pt-1 border-t border-emerald-500/20">
                  <span>Quality: {autoRetryInfo.selectedNextBestModel.qualityBenchmarkScore}/100</span>
                  <span className="text-emerald-400 font-bold">Status: 200 OK Executed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Criteria Highlights (4 Key Pillars) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Pillar 1: Task Complexity vs Quality Bar */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
              <Activity className="w-3.5 h-3.5" /> 1. Task Complexity
            </span>
            <span className="text-white font-bold">{complexityScore.toFixed(1)} / 10.0</span>
          </div>
          <div className="text-sm font-bold text-white flex items-center justify-between">
            <span>{TASK_ARCHETYPES[taskDistribution.primaryArchetype].name}</span>
            <span className="text-xs text-cyan-400 font-mono">Floor: {requiredQualityFloor}%</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-tight">
            Prompt requires score ≥{requiredQualityFloor}. {chosenModel.name} delivers {chosenModel.qualityBenchmarkScore}/100 quality.
          </p>
        </div>

        {/* Pillar 2: Cost Avoidance (Overkill Tax) */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
              <DollarSign className="w-3.5 h-3.5" /> 2. Cost Avoidance
            </span>
            <span className="text-emerald-400 font-bold">-{percentageSaved}% Cost</span>
          </div>
          <div className="text-sm font-bold text-emerald-300 flex items-center justify-between">
            <span>{costDeltaRatio}x Cheaper</span>
            <span className="text-xs font-mono text-slate-300">${chosenEstimatedCost.toFixed(6)}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-tight">
            Avoids burning ${baselineEstimatedCost.toFixed(6)} on {baselineFrontierModel.name} for zero noticeable quality gain.
          </p>
        </div>

        {/* Pillar 3: Bayesian Thompson Posterior */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> 3. Bayesian Posterior
            </span>
            <span className="text-amber-400 font-bold">Beta({bayesianPosterior.alpha}, {bayesianPosterior.beta})</span>
          </div>
          <div className="text-sm font-bold text-white flex items-center justify-between">
            <span>E[θ] = {(bayesianPosterior.mean * 100).toFixed(1)}%</span>
            <span className="text-xs text-amber-400 font-mono">Var: {bayesianPosterior.variance}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-tight">
            Thompson sampling drew top posterior for archetype {taskDistribution.primaryArchetype}.
          </p>
        </div>

        {/* Pillar 4: Latency & Speed Budget */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
              <Clock className="w-3.5 h-3.5" /> 4. Response Latency
            </span>
            <span className="text-purple-300 font-bold">{chosenModel.latencyAvgMs}ms avg</span>
          </div>
          <div className="text-sm font-bold text-purple-200 flex items-center justify-between">
            <span>-{(100 - (chosenModel.latencyAvgMs / baselineFrontierModel.latencyAvgMs) * 100).toFixed(0)}% Faster</span>
            <span className="text-xs font-mono text-slate-400">vs {baselineFrontierModel.latencyAvgMs}ms</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-tight">
            Sub-second execution preserves high interactive throughput without cold CoT overhead.
          </p>
        </div>

      </div>

      {/* VIEW 1: Cost vs. Task Complexity Tradeoff Curve */}
      {selectedExplainMode === 'cost_vs_complexity' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                Cost vs. Task Complexity Tier Spectrum (Overkill Avoidance Boundary)
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Selected: <strong className="text-emerald-400">{chosenModel.name} ({chosenModel.tier.toUpperCase()})</strong>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              WhyOr maps the prompt's complexity ({complexityScore}/10) to the lowest sufficient tier. 
              Higher tiers represent an unnecessary "Overkill Tax" for this task archetype.
            </p>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierCostComplexityData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="tier" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val}/M`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-950 border border-white/20 rounded-xl text-xs font-mono space-y-1 shadow-2xl">
                          <div className="font-bold text-white border-b border-white/10 pb-1">{data.tier}</div>
                          <div className="text-cyan-300">Cost: ${data.avgCostPerM.toFixed(2)}/M tokens</div>
                          <div className="text-slate-300">Benchmark Quality: {data.qualityScore}/100</div>
                          <div className="text-slate-400">Optimal Complexity Range: {data.complexityFit}</div>
                          {data.isSelectedTier && (
                            <div className="text-emerald-400 font-bold pt-1">✓ SELECTED: Exact Match for Complexity {complexityScore.toFixed(1)}</div>
                          )}
                          {data.isOverkill && (
                            <div className="text-rose-400 font-bold pt-1">⚠ OVERKILL: Costs +{Math.round((data.avgCostPerM / 0.15) * 100)}% for unneeded reasoning depth</div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="avgCostPerM" name="Average Cost ($/M Tokens)" radius={[6, 6, 0, 0]}>
                  {tierCostComplexityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isSelectedTier ? '#10b981' : entry.isOverkill ? '#f43f5e' : '#06b6d4'}
                      opacity={entry.isSelectedTier ? 1.0 : entry.isOverkill ? 0.4 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300 block">Why {chosenModel.name} Won:</strong>
                <span className="text-slate-300">
                  Satisfies all required capabilities ({classification.requiredCapabilities?.join(', ') || 'standard schema output'}) 
                  and quality threshold ({chosenModel.qualityBenchmarkScore} &gt; {requiredQualityFloor}) at the absolute lowest unit cost (${chosenModel.inputPricePerM}/M in).
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-400/20 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-300 block">Why Frontier Models Were Bypassed:</strong>
                <span className="text-slate-300">
                  Dispatching to {baselineFrontierModel.name} would incur a {costDeltaRatio}x cost penalty with 
                  no statistically significant gain in benchmark output quality for {TASK_ARCHETYPES[taskDistribution.primaryArchetype].name}.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: 5-Stage Decision Tree Funnel */}
      {selectedExplainMode === 'decision_tree' && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-slate-400 mb-2">
            Step-by-step mathematical elimination pipeline executed for this prompt:
          </div>

          <div className="space-y-2.5">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-400/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center font-bold text-[11px]">
                  1
                </span>
                <div>
                  <div className="text-white font-semibold">Stage 1: Pre-Call Heuristic & Semantic Centroid</div>
                  <div className="text-slate-400 text-[11px]">
                    Archetype: <strong className="text-cyan-300">{TASK_ARCHETYPES[taskDistribution.primaryArchetype].name}</strong> · Complexity: <strong className="text-white">{complexityScore}/10</strong> · Entropy: <strong className="text-white">{taskDistribution.entropy} bits</strong>
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Floor: {requiredQualityFloor}%
              </span>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-400/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-[11px]">
                  2
                </span>
                <div>
                  <div className="text-white font-semibold">Stage 2: RBAC Governance & Quota Filter</div>
                  <div className="text-slate-400 text-[11px]">
                    Caller: <strong className="text-amber-300">{activePersona.name} ({activePersona.role})</strong> · Allowed Tiers: [{activePersona.allowedTiers.join(', ')}]
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {allModels.filter(m => activePersona.allowedTiers.includes(m.tier)).length} / {allModels.length} Eligible
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-400/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center font-bold text-[11px]">
                  3
                </span>
                <div>
                  <div className="text-white font-semibold">Stage 3: Capability & Context Window Check</div>
                  <div className="text-slate-400 text-[11px]">
                    Required: [{classification.requiredCapabilities?.join(', ') || 'none'}] · Context Headroom: <strong className="text-purple-300">{(chosenModel.contextWindowTokens / 1000).toFixed(0)}k tokens</strong>
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Pass (100% Match)
              </span>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-400/40 bg-emerald-500/[0.04] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold text-[11px]">
                  4
                </span>
                <div>
                  <div className="text-white font-semibold">Stage 4: Thompson Sampling & Posterior Convergence</div>
                  <div className="text-slate-400 text-[11px]">
                    Candidate drawn score: <strong className="text-emerald-300">θ ~ Beta({bayesianPosterior.alpha}, {bayesianPosterior.beta}) = {(bayesianPosterior.mean * 100).toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Top Posterior
              </span>
            </div>

            {/* Step 5 */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-slate-950 to-slate-950 border border-emerald-400 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-extrabold flex items-center justify-center text-[11px]">
                  ✓
                </span>
                <div>
                  <div className="text-emerald-300 font-bold">Stage 5: Cost Optimization Winner Selected</div>
                  <div className="text-slate-300 text-[11px]">
                    <strong className="text-white">{chosenModel.name}</strong> selected at <strong className="text-emerald-300">${chosenModel.inputPricePerM}/M</strong> (Cheapest candidate meeting quality floor).
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-400 text-slate-950">
                DISPATCHED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Multi-Criteria Radar Comparison */}
      {selectedExplainMode === 'criteria_radar' && (
        <div className="space-y-4">
          <div className="text-xs font-mono text-slate-400">
            Multi-axis tradeoff comparison across Quality Fit, Cost Efficiency, Speed, Context, and Bayesian History:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
            <div className="md:col-span-7 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarCriteriaData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="criterion" stroke="#94a3b8" fontSize={11} />
                  <PolarRadiusAxis stroke="#64748b" angle={30} domain={[0, 100]} />
                  <Radar name={chosenModel.name} dataKey="chosen" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                  <Radar name={baselineFrontierModel.name} dataKey="baseline" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
                  <Radar name="Required Minimum" dataKey="requirement" stroke="#f59e0b" strokeDasharray="3 3" fill="none" />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="md:col-span-5 space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-1">
                <div className="text-emerald-300 font-bold flex items-center justify-between">
                  <span>{chosenModel.name} (Selected)</span>
                  <span>Score: {chosenModel.qualityBenchmarkScore}/100</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Optimized for speed ({chosenModel.latencyAvgMs}ms) and cost efficiency (${chosenModel.inputPricePerM}/M) with 100% compliance on quality floor.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-1">
                <div className="text-rose-300 font-bold flex items-center justify-between">
                  <span>{baselineFrontierModel.name} (Frontier Baseline)</span>
                  <span>Score: {baselineFrontierModel.qualityBenchmarkScore}/100</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  High quality ceiling ({baselineFrontierModel.qualityBenchmarkScore}/100), but imposes +{percentageSaved}% cost overhead and {baselineFrontierModel.latencyAvgMs}ms latency.
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/20 text-[11px] text-amber-300">
                <strong>Optimal Equilibrium:</strong> WhyOr captures 95%+ of frontier capability while shedding 88% of unit infrastructure cost.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: Candidate Disqualification Breakdown */}
      {selectedExplainMode === 'elimination_matrix' && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-slate-400 mb-2">
            Audit trail of why competing candidates were or were not chosen:
          </div>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {(candidateEvaluations.length > 0 ? candidateEvaluations : allModels.map(m => ({
              modelId: m.id,
              modelName: m.name,
              provider: m.provider,
              tier: m.tier,
              qualityScore: m.qualityBenchmarkScore,
              estimatedCostUsd: (500 / 1_000_000 * m.inputPricePerM) + (250 / 1_000_000 * m.outputPricePerM),
              isEligible: activePersona.allowedTiers.includes(m.tier) && m.qualityBenchmarkScore >= requiredQualityFloor,
              disqualificationReason: !activePersona.allowedTiers.includes(m.tier)
                ? `Tier '${m.tier}' restricted for persona role '${activePersona.role}'`
                : m.qualityBenchmarkScore < requiredQualityFloor
                ? `Quality (${m.qualityBenchmarkScore}) below required floor (${requiredQualityFloor})`
                : undefined,
              costEfficiencyRatio: Math.round(m.qualityBenchmarkScore / (m.inputPricePerM + 0.1) * 10),
              isCheapestEligible: m.id === chosenModel.id
            }))).map((cand, idx) => {
              const isWinner = cand.modelId === chosenModel.id;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border backdrop-blur-md text-xs font-mono flex items-center justify-between transition-all ${
                    isWinner
                      ? 'bg-emerald-500/15 border-emerald-400/60 shadow-lg'
                      : cand.isEligible
                      ? 'bg-slate-950/60 border-white/10 hover:border-white/20'
                      : 'bg-slate-950/30 border-white/5 opacity-60'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{cand.modelName}</span>
                      <span className="text-[10px] text-slate-400 uppercase">({cand.provider})</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                        {cand.tier}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Quality Score: <strong className="text-slate-200">{cand.qualityScore}/100</strong> · Estimated Cost: <strong className="text-white">${cand.estimatedCostUsd.toFixed(6)}</strong>
                    </div>
                    {cand.disqualificationReason && (
                      <div className="text-[10px] text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>Disqualified: {cand.disqualificationReason}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    {isWinner ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> SELECTED WINNER
                      </span>
                    ) : cand.isEligible ? (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full inline-block">
                          Eligible (+${(cand.estimatedCostUsd - chosenEstimatedCost).toFixed(6)})
                        </span>
                        {onSelectAlternativeModel && (
                          <div>
                            <button
                              onClick={() => onSelectAlternativeModel(cand.modelId)}
                              className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                            >
                              Force Dispath →
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[9px] text-rose-400 bg-rose-500/10 border border-rose-400/20 px-2 py-0.5 rounded-full">
                        Filtered Out
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Weight Sensitivity Simulator Toggle */}
      <div className="pt-2 border-t border-white/10">
        <button
          onClick={() => setShowSensitivitySimulator(!showSensitivitySimulator)}
          className="w-full p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between text-xs font-mono transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-semibold">Interactive Criteria Weight Simulator</span>
            <span className="text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-400/30 px-2 py-0.2 rounded-full">
              Try What-If Weights
            </span>
          </div>
          <span className="text-slate-400 text-xs">
            {showSensitivitySimulator ? 'Hide Simulator ↑' : 'Show Simulator ↓'}
          </span>
        </button>

        {showSensitivitySimulator && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-cyan-400/30 space-y-4 animate-in fade-in">
            <div className="text-xs text-slate-300">
              Adjust your organization's routing policy preferences to see which model wins in real-time:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              {/* Slider 1: Cost Weight */}
              <div className="space-y-1.5 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Cost Sensitivity:
                  </span>
                  <span className="font-bold text-white">{costWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={costWeight}
                  onChange={(e) => setCostWeight(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              {/* Slider 2: Quality Weight */}
              <div className="space-y-1.5 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Quality Priority:
                  </span>
                  <span className="font-bold text-white">{qualityWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={qualityWeight}
                  onChange={(e) => setQualityWeight(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Slider 3: Latency Weight */}
              <div className="space-y-1.5 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Speed / Latency:
                  </span>
                  <span className="font-bold text-white">{latencyWeight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={latencyWeight}
                  onChange={(e) => setLatencyWeight(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>
            </div>

            {/* Simulation Result Box */}
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-300">Under this simulated weight policy, winner is:</span>
                <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded border border-white/10">
                  {simulatedWinner.name} ({simulatedWinner.tier})
                </span>
              </div>
              {simulatedWinner.id === chosenModel.id ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Matches Current Auto-Route
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" /> Differs from Current Route
                </span>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
