import React, { useState } from 'react';
import { 
  AIModel, 
  UserPersona, 
  DispatchRequest, 
  DispatchResponse, 
  ModelTier, 
  ContextLedgerEntry 
} from '../types';
import { PRESET_SAMPLE_PROMPTS } from '../data/mockData';
import { classifyPromptHeuristic, selectBestModel, calculateTokenSavings, createLedgerEntry, applyAutomatedTokenReduction, evaluateAllCandidateModels } from '../utils/classifier';
import { softClassifier, TaskProbabilityDistribution } from '../core/embeddingClassifier';
import { TASK_ARCHETYPES, TaskArchetypeId } from '../core/taskTaxonomy';
import { apiService } from '../core/apiSurface';
import { FEEDBACK_SIGNALS, FeedbackSignalType } from '../core/feedbackEngine';
import { AutoRoutingExplainabilityPanel } from './AutoRoutingExplainabilityPanel';
import { 
  Send, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  DollarSign, 
  TrendingDown, 
  TrendingUp,
  Clock, 
  Cpu, 
  Lock, 
  FileText, 
  Code2, 
  Scale, 
  Sliders, 
  ChevronRight,
  HelpCircle,
  Copy,
  Check,
  BarChart3,
  Filter,
  FileCode,
  Layers,
  Database,
  Users,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  ShieldAlert,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DispatchConsoleProps {
  models: AIModel[];
  activePersona: UserPersona;
  onNewLedgerEntry: (entry: ContextLedgerEntry) => void;
  recentLedger: ContextLedgerEntry[];
  onNavigateTab?: (tab: string) => void;
  prefilledPrompt?: string;
  prefilledModelId?: string;
  onClearPrefill?: () => void;
}

export const DispatchConsole: React.FC<DispatchConsoleProps> = ({
  models,
  activePersona,
  onNewLedgerEntry,
  recentLedger,
  onNavigateTab,
  prefilledPrompt,
  prefilledModelId,
  onClearPrefill,
}) => {
  const [prompt, setPrompt] = useState<string>(PRESET_SAMPLE_PROMPTS[0].prompt);
  const [routingMode, setRoutingMode] = useState<'auto' | 'enforce_tier' | 'enforce_model'>('auto');
  const [enforcedTier, setEnforcedTier] = useState<ModelTier>('low');
  const [enforcedModelId, setEnforcedModelId] = useState<string>(models[0]?.id || 'gemini-3.7-flash');
  const [byokKey, setByokKey] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [responseResult, setResponseResult] = useState<DispatchResponse | null>(null);
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [showCostMatrix, setShowCostMatrix] = useState<boolean>(true);
  const [resultTab, setResultTab] = useState<'output' | 'explainability' | 'taxonomy' | 'token_reduction' | 'candidates'>('output');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('all');
  const [taskDistribution, setTaskDistribution] = useState<TaskProbabilityDistribution>(() => softClassifier.classify(PRESET_SAMPLE_PROMPTS[0].prompt));
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [lastFeedbackType, setLastFeedbackType] = useState<FeedbackSignalType | null>(null);

  // Live classify prompt into 7-archetype probability distribution
  React.useEffect(() => {
    if (prompt.trim()) {
      const dist = softClassifier.classify(prompt);
      setTaskDistribution(dist);
    }
  }, [prompt]);

  const handleSendFeedback = (signalType: FeedbackSignalType, isSuccess: boolean) => {
    if (!responseResult) return;
    apiService.feedbackEngine.applyFeedback(
      responseResult.dispatchId,
      taskDistribution.primaryArchetype,
      responseResult.chosenModel.provider,
      responseResult.chosenModel.id,
      signalType,
      isSuccess,
      activePersona.role,
      'Dispatch console user rating'
    );
    setLastFeedbackType(signalType);
    const label = FEEDBACK_SIGNALS[signalType].name;
    setFeedbackNotice(`Applied ${label} → Bayesian Beta posterior updated for ${responseResult.chosenModel.name}.`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Handle incoming prefill from Catalog or Live Stream
  React.useEffect(() => {
    if (prefilledPrompt) {
      setPrompt(prefilledPrompt);
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefilledPrompt, onClearPrefill]);

  React.useEffect(() => {
    if (prefilledModelId) {
      setRoutingMode('enforce_model');
      setEnforcedModelId(prefilledModelId);
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefilledModelId, onClearPrefill]);

  // Trigger dispatch request
  const handleDispatch = async () => {
    if (!prompt.trim() || isDispatching) return;
    setIsDispatching(true);
    setActiveStep(1);

    try {
      // 1. Stage 1 Heuristic Pre-call classification
      const classification = classifyPromptHeuristic(prompt);
      setActiveStep(2);

      // 2. Persona permissions & model selection
      let targetTier = routingMode === 'enforce_tier' ? enforcedTier : classification.recommendedTier;
      let effectiveModelId = routingMode === 'enforce_model' ? enforcedModelId : undefined;

      const { chosenModel, baselineFrontierModel } = selectBestModel(
        models,
        targetTier,
        activePersona.allowedTiers
      );
      
      const finalModel = effectiveModelId ? (models.find(m => m.id === effectiveModelId) || chosenModel) : chosenModel;
      setActiveStep(3);

      // 3. Call Full-Stack Server API
      let apiResponse: DispatchResponse | null = null;

      try {
        const res = await fetch('/api/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            sessionId: recentLedger[0]?.sessionId || `sess_${Date.now().toString(36)}`,
            enforceTier: routingMode === 'enforce_tier' ? enforcedTier : undefined,
            enforceModelId: routingMode === 'enforce_model' ? enforcedModelId : undefined,
            userRole: activePersona.role,
            byokKey: activePersona.canBYOK ? byokKey : undefined,
          }),
        });

        if (res.ok) {
          apiResponse = await res.json();
        }
      } catch (e) {
        console.warn('Backend call fallback to client engine:', e);
      }

      setActiveStep(4);

      if (apiResponse) {
        setResponseResult(apiResponse);
        onNewLedgerEntry(apiResponse.ledgerEntry);

        if (apiResponse.metrics.savingsPercentage >= 40) {
          confetti({
            particleCount: 45,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#FF8A3D', '#4FD1C5', '#FFFFFF'],
          });
        }
      } else {
        // Fallback simulation if offline
        const inTokens = classification.estimatedInputTokens;
        const outTokens = classification.estimatedOutputTokens;
        const economics = calculateTokenSavings(inTokens, outTokens, finalModel, baselineFrontierModel);
        const tokenReduction = applyAutomatedTokenReduction(prompt, recentLedger, classification.taskCategory);
        const candidateResult = evaluateAllCandidateModels(models, classification, activePersona.allowedTiers);
        
        const ledgerEntry = await createLedgerEntry(
          `sess_${Date.now().toString(36)}`,
          recentLedger.length + 1,
          recentLedger[0]?.hash || '0000000000000000000000000000000000000000000000000000000000000000',
          prompt,
          finalModel,
          'Executed via WhyOr client routing & token compression engine.',
          inTokens + outTokens,
          economics.tokensSaved
        );

        const simulatedResponse: DispatchResponse = {
          dispatchId: `dsp_${Date.now().toString(36)}`,
          sessionId: ledgerEntry.sessionId,
          classification: {
            ...classification,
            tokenReduction,
          },
          chosenModel: finalModel,
          baselineFrontierModel,
          candidateEvaluations: candidateResult.evaluations,
          outputContent: `### Token-Optimized Output (${finalModel.name})\n\nContext has been successfully extracted and written to WhyOr Context Ledger.\n\n\`\`\`json\n{\n  "status": "success",\n  "task_category": "${classification.taskCategory}",\n  "routed_tier": "${finalModel.tier}",\n  "model_selected": "${finalModel.name}",\n  "token_savings_pct": "${economics.savingsPercentage}%",\n  "tokens_reduced": ${tokenReduction.totalTokensSaved}\n}\n\`\`\``,
          metrics: {
            inputTokens: inTokens,
            outputTokens: outTokens,
            totalTokens: inTokens + outTokens,
            costUsd: economics.costUsd,
            baselineCostUsd: economics.baselineCostUsd,
            costSavingsUsd: economics.costSavingsUsd,
            savingsPercentage: economics.savingsPercentage,
            tokensSaved: economics.tokensSaved,
            latencyMs: finalModel.latencyAvgMs,
          },
          ledgerEntry,
          executionStatus: 'success',
        };

        setResponseResult(simulatedResponse);
        onNewLedgerEntry(ledgerEntry);
      }

      setActiveStep(5);
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  // Provider unique list for filter buttons
  const uniqueProviders = Array.from(new Set(models.map(m => m.provider)));

  // Filtered models for matrix
  const filteredModels = models.filter(m => {
    return selectedProviderFilter === 'all' || m.provider === selectedProviderFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <Zap className="w-3.5 h-3.5" /> Intelligent AI Model Router & Token Economizer
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
              Route every prompt to the model that <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">earns it.</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              WhyOr Dispatch classifies task complexity, automatically strips unnecessary tokens across 7 specialized reduction techniques, and selects the cheapest effective model across {models.length}+ integrated models and tools.
            </p>

            {/* Quick Navigation Shortcuts */}
            {onNavigateTab && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10 text-xs font-mono">
                <span className="text-slate-500 text-[11px]">Quick Jump:</span>
                <button
                  onClick={() => onNavigateTab('catalog')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 hover:border-cyan-400/30 transition-all cursor-pointer text-[11px] flex items-center gap-1"
                >
                  <Layers className="w-3 h-3" /> Models & Tools ({models.length})
                </button>
                <button
                  onClick={() => onNavigateTab('ledger')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 hover:border-cyan-400/30 transition-all cursor-pointer text-[11px] flex items-center gap-1"
                >
                  <Database className="w-3 h-3" /> Context Ledger ({recentLedger.length})
                </button>
                <button
                  onClick={() => onNavigateTab('teams')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 hover:border-amber-400/30 transition-all cursor-pointer text-[11px] flex items-center gap-1"
                >
                  <Users className="w-3 h-3" /> Team Governance
                </button>
                <button
                  onClick={() => onNavigateTab('admin')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10 hover:border-amber-400/30 transition-all cursor-pointer text-[11px] flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3" /> Platform & Billing
                </button>
              </div>
            )}
          </div>

          {/* Persona Capability Card */}
          <div className="bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-xs font-mono shrink-0 backdrop-blur-md shadow-inner">
            <div className="text-slate-400 flex items-center justify-between gap-4">
              <span>ACTIVE CALLER:</span>
              <span className="text-cyan-400 font-semibold">{activePersona.name}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-4">
              <span className="text-slate-400">ALLOWED TIERS:</span>
              <span className="text-white font-bold">{activePersona.allowedTiers.join(', ')}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-4">
              <span className="text-slate-400">BYOK PRIVILEGE:</span>
              <span className={activePersona.canBYOK ? 'text-emerald-400' : 'text-slate-500'}>
                {activePersona.canBYOK ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Prompts Selector */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl shadow-black/20">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>Select Benchmark Test Prompts (Different Complexity Tiers & Capabilities):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_SAMPLE_PROMPTS.map((preset, idx) => (
            <button
              key={idx}
              id={`preset-prompt-btn-${idx}`}
              onClick={() => setPrompt(preset.prompt)}
              className="text-left p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-400/40 backdrop-blur-md transition-all text-xs group cursor-pointer"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-semibold">Tier: {preset.tierExpected.toUpperCase()}</span>
                <ChevronRight className="w-3 h-3 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="font-medium text-white truncate group-hover:text-amber-200 transition-colors">{preset.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Input & Routing Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Prompt & Routing Parameters */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="prompt-input" className="text-xs font-mono text-white uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                Prompt Payload
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                  <Activity className="w-2.5 h-2.5 text-emerald-400" />
                  {TASK_ARCHETYPES[taskDistribution.primaryArchetype].name} ({(taskDistribution.confidence * 100).toFixed(0)}%)
                </span>
                <button
                  onClick={() => setPrompt('')}
                  className="text-[10px] font-mono text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-white/5 border border-white/10 transition-colors cursor-pointer"
                  title="Clear Prompt Field"
                >
                  Clear
                </button>
                <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  ~{Math.ceil(prompt.split(/\s+/).filter(Boolean).length * 1.35)} Raw Tokens
                </span>
              </div>
            </div>

            <textarea
              id="prompt-input"
              rows={9}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleDispatch();
                }
              }}
              placeholder="Type or paste any task, query, extraction, code, or reasoning prompt... (Press Cmd+Enter to dispatch)"
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/40 resize-y transition-all leading-relaxed backdrop-blur-md"
            />

            {/* Routing Mode Selector */}
            <div className="mt-4 pt-4 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">ROUTING STRATEGY</label>
                <select
                  id="routing-strategy-select"
                  value={routingMode}
                  onChange={(e) => setRoutingMode(e.target.value as any)}
                  className="w-full bg-slate-950/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 backdrop-blur-md cursor-pointer"
                >
                  <option value="auto">✨ Auto 2-Stage Optimizer</option>
                  <option value="enforce_tier">🔒 Enforce Specific Tier</option>
                  <option value="enforce_model">🎯 Enforce Specific Model</option>
                </select>
              </div>

              {routingMode === 'enforce_tier' && (
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">ENFORCE TIER</label>
                  <select
                    id="enforce-tier-select"
                    value={enforcedTier}
                    onChange={(e) => setEnforcedTier(e.target.value as any)}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 backdrop-blur-md cursor-pointer"
                  >
                    {activePersona.allowedTiers.map((t) => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )}

              {routingMode === 'enforce_model' && (
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">ENFORCE MODEL</label>
                  <select
                    id="enforce-model-select"
                    value={enforcedModelId}
                    onChange={(e) => setEnforcedModelId(e.target.value)}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 backdrop-blur-md cursor-pointer"
                  >
                    {models
                      .filter((m) => activePersona.allowedTiers.includes(m.tier))
                      .map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.tierLabel})</option>
                      ))}
                  </select>
                </div>
              )}

              {activePersona.canBYOK && (
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">CUSTOM BYOK KEY (OPTIONAL)</label>
                  <input
                    type="password"
                    value={byokKey}
                    onChange={(e) => setByokKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400 backdrop-blur-md"
                  />
                </div>
              )}
            </div>

            {/* Dispatch Action Button */}
            <div className="mt-5 flex items-center justify-between">
              <div className="text-[11px] font-mono text-slate-400">
                {activePersona.role === 'guest' ? (
                  <span className="text-amber-400">⚠️ Guest session (Low/Mid tiers only)</span>
                ) : (
                  <span className="text-slate-300">✅ All {activePersona.allowedTiers.length} model tiers enabled (Cmd+Enter)</span>
                )}
              </div>

              <button
                id="dispatch-submit-btn"
                data-testid="route-request-btn"
                onClick={handleDispatch}
                disabled={isDispatching || !prompt.trim()}
                title="Route Request & Optimize (Cmd+Enter)"
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg backdrop-blur-md border ${
                  isDispatching
                    ? 'bg-slate-800 text-slate-400 border-white/10 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-orange-400/40 shadow-orange-500/25 hover:shadow-orange-500/40'
                }`}
              >
                {isDispatching ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Optimizing & Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Route Request & Optimize</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Pipeline Stepper */}
          <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-xl shadow-black/20">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-200">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                WhyOr Dispatch 4-Stage Decision Flow
              </span>
              {isDispatching && <span className="text-cyan-400 animate-pulse font-bold">STAGE {activeStep}/5</span>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
                activeStep >= 1 ? 'bg-slate-950/60 border-cyan-400/40 text-white shadow-sm' : 'bg-slate-950/30 border-white/[0.06] text-slate-400'
              }`}>
                <div className="text-[10px] text-cyan-400 font-bold">STAGE 01</div>
                <div className="font-semibold text-xs mt-0.5">Pre-Call Scoring</div>
                <div className="text-[10px] text-slate-400 mt-1">Heuristics & AST check</div>
              </div>

              <div className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
                activeStep >= 2 ? 'bg-slate-950/60 border-cyan-400/40 text-white shadow-sm' : 'bg-slate-950/30 border-white/[0.06] text-slate-400'
              }`}>
                <div className="text-[10px] text-cyan-400 font-bold">STAGE 02</div>
                <div className="font-semibold text-xs mt-0.5">7x Token Reduction</div>
                <div className="text-[10px] text-slate-400 mt-1">Prune, Compress, KV-Cache</div>
              </div>

              <div className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
                activeStep >= 3 ? 'bg-slate-950/60 border-cyan-400/40 text-white shadow-sm' : 'bg-slate-950/30 border-white/[0.06] text-slate-400'
              }`}>
                <div className="text-[10px] text-cyan-400 font-bold">STAGE 03</div>
                <div className="font-semibold text-xs mt-0.5">Cheapest Selection</div>
                <div className="text-[10px] text-slate-400 mt-1">Evaluates {models.length} models</div>
              </div>

              <div className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
                activeStep >= 5 ? 'bg-slate-950/60 border-amber-400/50 text-white shadow-sm' : 'bg-slate-950/30 border-white/[0.06] text-slate-400'
              }`}>
                <div className="text-[10px] text-amber-400 font-bold">STAGE 04</div>
                <div className="font-semibold text-xs mt-0.5">Ledger Hash Lock</div>
                <div className="text-[10px] text-slate-400 mt-1">SHA-256 context verified</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results, Diagnostic Tabs & Token Reductions */}
        <div className="lg:col-span-6 space-y-4">
          {responseResult ? (
            <>
              {/* Savings Highlight Card */}
              <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-blue-950/40 border border-amber-400/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400 uppercase tracking-wider">CHEAPEST EFFECTIVE ROUTED</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[11px] border border-cyan-400/30 backdrop-blur-md">
                    {responseResult.classification.confidencePercent}% MATCH CONFIDENCE
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <h3 className="text-xl font-display font-bold text-white">
                    {responseResult.chosenModel.name}
                  </h3>
                  <span className="text-xs font-mono text-amber-400">
                    [{responseResult.chosenModel.tierLabel}]
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans">
                  {responseResult.classification.routingReason}
                </p>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/10 text-center font-mono">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="text-[9px] text-slate-400">NET SAVINGS</div>
                    <div className="text-sm font-bold text-cyan-400 mt-0.5">
                      {responseResult.metrics.savingsPercentage}%
                    </div>
                    <div className="text-[8px] text-slate-500">vs Frontier</div>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="text-[9px] text-slate-400">TOKENS SAVED</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {responseResult.metrics.tokensSaved.toLocaleString()}
                    </div>
                    <div className="text-[8px] text-slate-500">Auto-compressed</div>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="text-[9px] text-slate-400">ACTUAL COST</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      ${responseResult.metrics.costUsd.toFixed(6)}
                    </div>
                    <div className="text-[8px] text-slate-500">Executed</div>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="text-[9px] text-slate-400">BENCHMARK</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">
                      {responseResult.chosenModel.qualityBenchmarkScore}/100
                    </div>
                    <div className="text-[8px] text-slate-500">Quality score</div>
                  </div>
                </div>

                {/* Auto-Routing Selection Criteria Strip */}
                <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-400">Decision Criteria:</span>
                    <span className="text-amber-300 font-bold">Complexity {responseResult.classification.complexityScore?.toFixed(1) || '5.0'}/10</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400 font-bold">-{responseResult.metrics.savingsPercentage}% Cost vs Frontier</span>
                  </div>
                  <button
                    id="quick-explain-btn"
                    onClick={() => setResultTab('explainability')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] transition-all cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Explain Selection Criteria →</span>
                  </button>
                </div>
              </div>

              {/* Multi-Tab Results Inspector */}
              <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5 shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setResultTab('output')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                        resultTab === 'output'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                          : 'text-slate-400 hover:text-white bg-white/5 border border-white/5'
                      }`}
                    >
                      Output Response
                    </button>
                    <button
                      id="tab-btn-explainability"
                      onClick={() => setResultTab('explainability')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        resultTab === 'explainability'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                          : 'text-slate-400 hover:text-white bg-white/5 border border-white/5'
                      }`}
                    >
                      <Scale className="w-3 h-3 text-amber-400" />
                      Auto-Routing Explainability
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-400/30">
                        Criteria
                      </span>
                    </button>
                    <button
                      onClick={() => setResultTab('taxonomy')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        resultTab === 'taxonomy'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : 'text-slate-400 hover:text-white bg-white/5 border border-white/5'
                      }`}
                    >
                      <Activity className="w-3 h-3 text-emerald-400" />
                      Task Taxonomy ({taskDistribution.confidence * 100}%)
                    </button>
                    <button
                      onClick={() => setResultTab('token_reduction')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        resultTab === 'token_reduction'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : 'text-slate-400 hover:text-white bg-white/5 border border-white/5'
                      }`}
                    >
                      <Zap className="w-3 h-3 text-cyan-400" />
                      7 Token Reductions
                      {responseResult.classification.tokenReduction && (
                        <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-1.5 rounded-full">
                          -{responseResult.classification.tokenReduction.reductionPercentage}%
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setResultTab('candidates')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        resultTab === 'candidates'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                          : 'text-slate-400 hover:text-white bg-white/5 border border-white/5'
                      }`}
                    >
                      <BarChart3 className="w-3 h-3 text-purple-400" />
                      Candidate Matrix ({responseResult.candidateEvaluations?.length || models.length})
                    </button>
                  </div>

                  {resultTab === 'output' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        id="copy-output-btn"
                        onClick={() => copyToClipboard(responseResult.outputContent)}
                        className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                        title="Copy Output"
                      >
                        {copiedOutput ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>

                      <button
                        id="copy-json-result-btn"
                        onClick={() => copyToClipboard(JSON.stringify(responseResult, null, 2))}
                        className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 hover:text-white px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 transition-all cursor-pointer"
                        title="Copy Entire Dispatch Telemetry JSON"
                      >
                        <FileCode className="w-3 h-3 text-cyan-400" />
                        <span>JSON</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* TAB 1: Generated Output */}
                {resultTab === 'output' && (
                  <div className="space-y-3">
                    <div className="bg-slate-950/70 border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-100 max-h-[340px] overflow-y-auto whitespace-pre-wrap leading-relaxed backdrop-blur-md shadow-inner">
                      {responseResult.outputContent}
                    </div>

                    {/* Live Bayesian Feedback Bar (§4.5) */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Rate Completion Outcome (Updates Beta Posterior):
                        </span>
                        {feedbackNotice && (
                          <span className="text-[11px] text-emerald-400 font-bold animate-in fade-in">
                            {feedbackNotice}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleSendFeedback('EXPLICIT_THUMBS', true)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                            lastFeedbackType === 'EXPLICIT_THUMBS' ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Thumbs Up (w=1.0)</span>
                        </button>
                        <button
                          onClick={() => handleSendFeedback('EXPLICIT_THUMBS', false)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-400/30 text-xs font-mono transition-all cursor-pointer"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>Thumbs Down (w=1.0)</span>
                        </button>
                        <button
                          onClick={() => handleSendFeedback('EXPLICIT_REGENERATE', false)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-mono transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Regenerate (w=0.8)</span>
                        </button>
                        <button
                          onClick={() => handleSendFeedback('IMPLICIT_SCHEMA_FAIL', false)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-mono transition-all cursor-pointer"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Schema Fail (w=0.6)</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick navigation actions from dispatch result */}
                    {onNavigateTab && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs font-mono">
                        <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Recorded to SHA-256 Ledger:</span>
                          <span className="text-cyan-300 font-bold">
                            {(responseResult.ledgerEntry?.hash || responseResult.ledgerEntry?.id || responseResult.dispatchId || 'cxl_verified').slice(0, 10)}...
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            id="view-savings-analytics-btn"
                            onClick={() => onNavigateTab('analytics')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <TrendingUp className="w-3 h-3 text-emerald-400" /> Savings Analytics →
                          </button>
                          <button
                            id="view-ledger-entry-btn"
                            onClick={() => onNavigateTab('ledger')}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[11px] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Database className="w-3 h-3" /> View in Ledger →
                          </button>
                          <button
                            id="view-model-in-catalog-btn"
                            onClick={() => onNavigateTab('catalog')}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Layers className="w-3 h-3" /> Model Specs →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: 7 Automated Token Reduction Techniques Breakdown */}
                {resultTab === 'token_reduction' && (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {responseResult.classification.tokenReduction ? (
                      <>
                        <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-xl p-3 text-xs font-mono flex items-center justify-between text-cyan-200">
                          <div>
                            <span className="text-white font-bold">Total Tokens Before: </span>
                            {responseResult.classification.tokenReduction.totalTokensBefore} →{' '}
                            <span className="text-white font-bold">Optimized: </span>
                            {responseResult.classification.tokenReduction.totalTokensAfter}
                          </div>
                          <div className="font-bold text-emerald-400">
                            {responseResult.classification.tokenReduction.totalTokensSaved} tokens saved ({responseResult.classification.tokenReduction.reductionPercentage}%)
                          </div>
                        </div>

                        <div className="space-y-2">
                          {responseResult.classification.tokenReduction.techniques.map((tech, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border backdrop-blur-md text-xs font-mono transition-all ${
                                tech.applied
                                  ? 'bg-slate-950/60 border-cyan-400/30'
                                  : 'bg-slate-950/30 border-white/[0.05] opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-white/10 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                                    0{idx + 1}
                                  </span>
                                  <span className="font-semibold text-white">{tech.name}</span>
                                </div>
                                {tech.applied ? (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                                    -{tech.percentSaved}% ({tech.tokensSaved} tok saved)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                                    Bypassed (Zero bloat)
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 font-sans leading-relaxed">
                                {tech.description}
                              </p>
                              {tech.notes && (
                                <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1 font-mono">
                                  <span className="text-cyan-400">Action:</span> {tech.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-xs text-slate-400">
                        Token reduction telemetry not available for this run.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Candidate Selection Engine Matrix */}
                {resultTab === 'candidates' && (
                  <div className="max-h-[360px] overflow-y-auto pr-1">
                    <div className="text-[11px] font-mono text-slate-400 mb-2">
                      Live eligibility and cost comparison for this specific prompt:
                    </div>
                    <div className="space-y-1.5">
                      {(responseResult.candidateEvaluations || []).map((cand, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border backdrop-blur-md text-xs font-mono flex items-center justify-between ${
                            cand.isCheapestEligible || responseResult.chosenModel.id === cand.modelId
                              ? 'bg-amber-500/15 border-amber-400/50 shadow-md'
                              : cand.isEligible
                              ? 'bg-slate-950/50 border-white/10'
                              : 'bg-slate-950/20 border-white/5 opacity-50'
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
                          </div>

                          <div className="text-right">
                            {cand.isCheapestEligible || responseResult.chosenModel.id === cand.modelId ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> CHEAPEST WINNER
                              </span>
                            ) : cand.isEligible ? (
                              <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                                Eligible (${cand.estimatedCostUsd.toFixed(6)})
                              </span>
                            ) : (
                              <span className="text-[9px] text-rose-400 bg-rose-500/10 border border-rose-400/20 px-2 py-0.5 rounded-full" title={cand.disqualificationReason}>
                                Disqualified
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: Soft Probabilistic Task Taxonomy Breakdown */}
                {resultTab === 'taxonomy' && (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-mono space-y-1.5">
                      <div className="flex items-center justify-between text-emerald-300 font-bold">
                        <span>Primary Archetype: {TASK_ARCHETYPES[taskDistribution.primaryArchetype].name}</span>
                        <span>Confidence: {(taskDistribution.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">
                        {taskDistribution.reasoning}
                      </p>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-white/10 flex items-center justify-between">
                        <span>Softmax Distribution Entropy: {taskDistribution.entropy} bits</span>
                        <span>Tier Hint: {TASK_ARCHETYPES[taskDistribution.primaryArchetype].tierHint.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {Object.values(TASK_ARCHETYPES).map((arch) => {
                        const prob = taskDistribution.probabilities[arch.id] || 0;
                        const isPrimary = arch.id === taskDistribution.primaryArchetype;

                        return (
                          <div
                            key={arch.id}
                            className={`p-3 rounded-xl border transition-all text-xs font-mono ${
                              isPrimary
                                ? 'bg-emerald-500/10 border-emerald-400/40 shadow-sm'
                                : 'bg-slate-950/40 border-white/5 opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{arch.name}</span>
                                <span className="text-[10px] text-slate-400">({arch.tierHint} tier)</span>
                              </div>
                              <span className={`text-[11px] font-bold ${isPrimary ? 'text-emerald-300' : 'text-slate-400'}`}>
                                {(prob * 100).toFixed(1)}%
                              </span>
                            </div>

                            {/* Probability Progress Bar */}
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isPrimary ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-slate-500'
                                }`}
                                style={{ width: `${Math.max(2, prob * 100)}%` }}
                              />
                            </div>

                            <div className="text-[10px] text-slate-400 font-sans line-clamp-1">
                              {arch.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 5: Auto-Routing Explainability Panel */}
                {resultTab === 'explainability' && (
                  <AutoRoutingExplainabilityPanel
                    chosenModel={responseResult.chosenModel}
                    baselineFrontierModel={responseResult.baselineFrontierModel}
                    classification={responseResult.classification}
                    taskDistribution={taskDistribution}
                    candidateEvaluations={responseResult.candidateEvaluations}
                    allModels={models}
                    activePersona={activePersona}
                    qualityTracker={apiService.qualityTracker}
                    onSelectAlternativeModel={(modelId) => {
                      setRoutingMode('enforce_model');
                      setEnforcedModelId(modelId);
                      setResultTab('output');
                    }}
                  />
                )}
              </div>
            </>
          ) : (
            /* Idle Placeholder */
            <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[440px] shadow-2xl shadow-black/30">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg backdrop-blur-md">
                <Cpu className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-display font-semibold text-white">
                Ready for Dispatch
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
                Click <strong>"Dispatch & Optimize"</strong> to run our 2-stage complexity classifier, apply 7 token reduction techniques, pick the cheapest effective model, and generate cryptographic context ledger entries.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] font-mono text-slate-300">
                <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md">⚡ Sub-millisecond routing</span>
                <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md">💰 65-85% token savings</span>
                <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md">🔒 {models.length} Models & Tools</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Model Comparison Matrix (Proof of Savings across all 28+ Models) */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
              Comparative Token Economics Engine ({models.length} Models & Tools Registered)
            </div>
            <h3 className="text-lg font-display font-bold text-white mt-0.5">
              Live cost & quality matrix across all AI providers
            </h3>
          </div>
          
          <button
            onClick={() => setShowCostMatrix(!showCostMatrix)}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-400/20 backdrop-blur-md transition-all cursor-pointer self-start md:self-auto"
          >
            {showCostMatrix ? 'Collapse Matrix' : 'Expand Full Matrix'}
          </button>
        </div>

        {showCostMatrix && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.08]">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Provider:
              </span>
              <button
                onClick={() => setSelectedProviderFilter('all')}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedProviderFilter === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                All ({models.length})
              </button>
              {uniqueProviders.map((prov) => (
                <button
                  key={prov}
                  onClick={() => setSelectedProviderFilter(prov)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-all cursor-pointer uppercase ${
                    selectedProviderFilter === prov
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] uppercase">
                    <th className="py-3 pr-4">Model & Provider</th>
                    <th className="py-3 px-3">Tier</th>
                    <th className="py-3 px-3">Capabilities</th>
                    <th className="py-3 px-3">Price / 1M (In/Out)</th>
                    <th className="py-3 px-3">This Request Cost</th>
                    <th className="py-3 px-3">Quality</th>
                    <th className="py-3 pl-4 text-right">WhyOr Dispatch Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredModels.map((m) => {
                    const inTokens = Math.ceil(prompt.split(/\s+/).filter(Boolean).length * 1.35);
                    const outTokens = 250;
                    const cost = (inTokens / 1_000_000 * m.inputPricePerM) + (outTokens / 1_000_000 * m.outputPricePerM);
                    const isSelected = responseResult?.chosenModel.id === m.id;

                    return (
                      <tr key={m.id} className={`transition-colors ${isSelected ? 'bg-amber-500/10 font-medium' : 'hover:bg-white/[0.04]'}`}>
                        <td className="py-3.5 pr-4 font-sans font-medium text-white flex items-center gap-2">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />}
                          <span>{m.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({m.providerDisplayName})</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-white/10 text-slate-300 border border-white/10">
                            {m.tier}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[10px] text-slate-400">
                          <div className="flex gap-1 flex-wrap max-w-[150px]">
                            {m.capabilities.code && <span className="text-cyan-400">code</span>}
                            {m.capabilities.reasoning && <span className="text-amber-400">reasoning</span>}
                            {m.capabilities.onlineSearch && <span className="text-emerald-400">search</span>}
                            {m.capabilities.toolExecution && <span className="text-purple-400">tools</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-400">
                          ${m.inputPricePerM} / ${m.outputPricePerM}
                        </td>
                        <td className="py-3.5 px-3 text-white font-semibold">
                          ${cost.toFixed(6)}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full" style={{ width: `${m.qualityBenchmarkScore}%` }} />
                            </div>
                            <span className="text-[11px] text-slate-400">{m.qualityBenchmarkScore}</span>
                          </div>
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                              <CheckCircle2 className="w-3 h-3" /> BEST FIT ROUTED
                            </span>
                          ) : m.status !== 'active' ? (
                            <span className="text-[10px] text-slate-500">Deprecated</span>
                          ) : (
                            <button
                              id={`route-with-model-${m.id}`}
                              onClick={() => {
                                setRoutingMode('enforce_model');
                                setEnforcedModelId(m.id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/20 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                              title={`Select ${m.name} as enforced target model`}
                            >
                              <Zap className="w-2.5 h-2.5" /> Enforce & Test
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
