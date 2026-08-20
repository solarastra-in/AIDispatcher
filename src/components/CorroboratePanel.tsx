import { useState } from "react";
import { authedFetch } from "../lib/firebaseClient";
import { GitCompare, Sparkles, AlertTriangle, CheckCircle2, Cpu, RefreshCw, Key, HelpCircle, ArrowRight } from "lucide-react";

interface FactComparison {
  status: "agree" | "contradict" | "unique_to_a" | "unique_to_b";
  impact: "high" | "medium" | "low";
  note: string;
}

interface CorroborationResult {
  responseA: { provider: string; modelId: string; text: string; costUsd: number };
  responseB: { provider: string; modelId: string; text: string; costUsd: number };
  comparison: {
    agreementScore: number | null;
    comparableFactCount: number;
    agreements: FactComparison[];
    contradictions: FactComparison[];
    uniqueToA: FactComparison[];
    uniqueToB: FactComparison[];
    highImpactContradictionCount: number;
  };
  totalCostUsd: number;
  recommendation: string;
}

export interface ModelOption {
  provider: string;
  modelId: string;
  label: string;
  category: "zero_config" | "subscription" | "byok_key";
  billingTag: string;
  requiresKey?: boolean;
}

const AVAILABLE_CORROBORATE_MODELS: ModelOption[] = [
  // 1. Zero-Config Platform Ready Models
  { provider: "google", modelId: "gemini-3.7-flash", label: "Gemini 3.7 Flash", category: "zero_config", billingTag: "Platform Ready (Zero-Config)", requiresKey: false },
  { provider: "google", modelId: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", category: "zero_config", billingTag: "Platform Ready (Zero-Config)", requiresKey: false },
  { provider: "google", modelId: "gemini-flash-latest", label: "Gemini Flash (Latest)", category: "zero_config", billingTag: "Platform Ready (Zero-Config)", requiresKey: false },

  // 2. Linked Flat-Rate Subscriptions ($0.00/token)
  { provider: "openai", modelId: "openai-subscription-gpt4o", label: "ChatGPT Plus/Pro (Subscription Bridge)", category: "subscription", billingTag: "Subscription ($0.00/tok)", requiresKey: false },
  { provider: "anthropic", modelId: "claude-subscription-sonnet", label: "Claude Pro/Max (CLI Subscription Bridge)", category: "subscription", billingTag: "Subscription ($0.00/tok)", requiresKey: false },
  { provider: "google", modelId: "google-subscription-advanced", label: "Google One AI Premium / Gemini Advanced", category: "subscription", billingTag: "Subscription ($0.00/tok)", requiresKey: false },
  { provider: "deepseek", modelId: "deepseek-subscription", label: "DeepSeek VIP Web Session", category: "subscription", billingTag: "Subscription ($0.00/tok)", requiresKey: false },

  // 3. Direct Pay-Per-Token API Keys (BYOK - Bring Your Own Key)
  { provider: "openai", modelId: "gpt-4o", label: "OpenAI GPT-4o (Direct API Key)", category: "byok_key", billingTag: "BYOK Key (Per-Token)", requiresKey: true },
  { provider: "openai", modelId: "gpt-4o-mini", label: "OpenAI GPT-4o-mini (Direct API Key)", category: "byok_key", billingTag: "BYOK Key (Per-Token)", requiresKey: true },
  { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet (Direct API Key)", category: "byok_key", billingTag: "BYOK Key (Per-Token)", requiresKey: true },
  { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Direct API Key)", category: "byok_key", billingTag: "BYOK Key (Per-Token)", requiresKey: true },
  { provider: "deepseek", modelId: "deepseek-chat", label: "DeepSeek V3 (Direct API Key)", category: "byok_key", billingTag: "BYOK Key (Per-Token)", requiresKey: true },
  { provider: "groq", modelId: "llama-3.3-70b-versatile", label: "Groq Llama 3.3 70B (Direct API Key)", category: "byok_key", billingTag: "BYOK Key (Per-Token)", requiresKey: true },
  { provider: "mistral", modelId: "mistral-large-latest", label: "Mistral Large (Direct API Key)", category: "byok_key", billingTag: "BYOK Key (Per-Token)", requiresKey: true },
];

const SAMPLE_FACT_QUERIES = [
  "What were Apple's total annual revenue and iPhone revenue numbers for FY 2023?",
  "What is the difference between SOC 2 Type I and SOC 2 Type II audit compliance standards?",
  "Under EU GDPR Article 33, what is the exact required notification window for a personal data breach?",
  "What is the boiling point and vapor pressure of pure isopropyl alcohol at 1 atmosphere of pressure?",
];

export default function CorroboratePanel({
  prompt: initialPrompt,
  modelA: defaultModelA = { provider: "google", modelId: "gemini-3.7-flash", label: "Gemini 3.7 Flash" },
  modelB: defaultModelB = { provider: "google", modelId: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
  onNavigateTab,
}: {
  prompt?: string;
  modelA?: { provider: string; modelId: string; label: string };
  modelB?: { provider: string; modelId: string; label: string };
  onNavigateTab?: (tab: string) => void;
}) {
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [modelA, setModelA] = useState<ModelOption>(
    AVAILABLE_CORROBORATE_MODELS.find(m => m.modelId === defaultModelA.modelId) || AVAILABLE_CORROBORATE_MODELS[0]
  );
  const [modelB, setModelB] = useState<ModelOption>(
    AVAILABLE_CORROBORATE_MODELS.find(m => m.modelId === defaultModelB.modelId) || AVAILABLE_CORROBORATE_MODELS[1]
  );
  const [result, setResult] = useState<CorroborationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runCheck() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await authedFetch("/api/dispatch/corroborate", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          modelA: { provider: modelA.provider, modelId: modelA.modelId, label: modelA.label },
          modelB: { provider: modelB.provider, modelId: modelB.modelId, label: modelB.label },
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      let data: any;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        if (rawText.toLowerCase().includes("<html") || rawText.toLowerCase().includes("<!doctype")) {
          throw new Error("The service was momentarily reconnecting. Please retry your corroboration check.");
        }
        throw new Error(rawText.slice(0, 160) || "Received an unexpected server response.");
      }

      if (!res.ok || data.error) {
        setError(data.error || "Cross-model corroboration failed. Please verify provider connectivity.");
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e.message || "Failed to execute cross-model corroboration.");
    } finally {
      setLoading(false);
    }
  }

  const setZeroConfigPair = () => {
    setModelA(AVAILABLE_CORROBORATE_MODELS[0]); // Gemini 3.7 Flash
    setModelB(AVAILABLE_CORROBORATE_MODELS[1]); // Gemini 3.1 Flash Lite
    setError(null);
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase tracking-wider">
              Fact Verification
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Dual-Engine Synthesis
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-display text-slate-100 mt-2 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-orange-400" />
            WhyOr Corroborate — Cross-Model Fact Checking
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Simultaneously dispatches the prompt through <span className="text-orange-300 font-semibold">{modelA.label}</span> and{" "}
            <span className="text-cyan-300 font-semibold">{modelB.label}</span>, extracting factual claims, comparing figures, and surfacing discrepancies.
          </p>
        </div>

        <button
          onClick={runCheck}
          disabled={loading || !prompt.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 disabled:opacity-40 transition-all cursor-pointer shrink-0"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{loading ? "Corroborating Facts…" : "Run Corroboration"}</span>
        </button>
      </div>

      {/* Model Selection Bar */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-orange-400" />
            Select Verification Pair:
          </span>
          
          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-slate-500">Presets:</span>
            <button
              type="button"
              onClick={setZeroConfigPair}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer transition-colors"
            >
              Gemini 3.7 + Flash Lite (Zero-Config)
            </button>
            <button
              type="button"
              onClick={() => {
                setModelA(AVAILABLE_CORROBORATE_MODELS[0]); // Gemini 3.7 Flash
                setModelB(AVAILABLE_CORROBORATE_MODELS[3]); // ChatGPT Plus/Pro
                setError(null);
              }}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer transition-colors"
            >
              Gemini + ChatGPT (Sub)
            </button>
            <button
              type="button"
              onClick={() => {
                setModelA(AVAILABLE_CORROBORATE_MODELS[0]); // Gemini 3.7 Flash
                setModelB(AVAILABLE_CORROBORATE_MODELS[7]); // OpenAI GPT-4o (BYOK)
                setError(null);
              }}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer transition-colors"
            >
              Gemini + GPT-4o (BYOK)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-mono text-orange-300 font-semibold mb-1">
              Model A (Primary Engine)
            </label>
            <select
              value={modelA.modelId}
              onChange={(e) => {
                const found = AVAILABLE_CORROBORATE_MODELS.find(m => m.modelId === e.target.value);
                if (found) setModelA(found);
              }}
              className="w-full bg-slate-900 border border-orange-500/30 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <optgroup label="⚡ Zero-Config Platform Models (Instant Ready)">
                {AVAILABLE_CORROBORATE_MODELS.filter(m => m.category === 'zero_config').map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.label} • [Zero-Config Ready]
                  </option>
                ))}
              </optgroup>
              <optgroup label="🛡️ Linked Flat Subscriptions ($0.00/token Flat)">
                {AVAILABLE_CORROBORATE_MODELS.filter(m => m.category === 'subscription').map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.label} • [Subscription $0/tok]
                  </option>
                ))}
              </optgroup>
              <optgroup label="🔑 Direct BYOK API Keys (Metered Per-Token)">
                {AVAILABLE_CORROBORATE_MODELS.filter(m => m.category === 'byok_key').map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.label} • [BYOK Key]
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-cyan-300 font-semibold mb-1">
              Model B (Comparative Engine)
            </label>
            <select
              value={modelB.modelId}
              onChange={(e) => {
                const found = AVAILABLE_CORROBORATE_MODELS.find(m => m.modelId === e.target.value);
                if (found) setModelB(found);
              }}
              className="w-full bg-slate-900 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <optgroup label="⚡ Zero-Config Platform Models (Instant Ready)">
                {AVAILABLE_CORROBORATE_MODELS.filter(m => m.category === 'zero_config').map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.label} • [Zero-Config Ready]
                  </option>
                ))}
              </optgroup>
              <optgroup label="🛡️ Linked Flat Subscriptions ($0.00/token Flat)">
                {AVAILABLE_CORROBORATE_MODELS.filter(m => m.category === 'subscription').map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.label} • [Subscription $0/tok]
                  </option>
                ))}
              </optgroup>
              <optgroup label="🔑 Direct BYOK API Keys (Metered Per-Token)">
                {AVAILABLE_CORROBORATE_MODELS.filter(m => m.category === 'byok_key').map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.label} • [BYOK Key]
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Explainer Legend */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <strong className="text-slate-300">Ready:</strong> Zero-config instant pool
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <strong className="text-slate-300">Subscription ($0/tok):</strong> Linked ChatGPT/Claude plan
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <strong className="text-slate-300">BYOK Key:</strong> "Bring Your Own Key" (Developer API Key)
            </span>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('credentials')}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[10px] font-bold underline transition-colors cursor-pointer self-end sm:self-auto"
            >
              <span>Manage Keys & Subscriptions</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-mono text-slate-300 font-semibold">
            Target Question or Claim to Corroborate:
          </label>
          <span className="text-[11px] font-mono text-slate-500">
            {prompt.length} chars
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.06] text-[11px] text-slate-300 leading-relaxed">
          <span className="font-semibold text-orange-300 font-mono">Fact checking prompt:</span> Enter any factual assertion, compliance requirement, technical hypothesis, medical/legal clause, or financial question. Both models will analyze the query independently to surface consensus vs. hallucinations.
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter statement, policy requirement, or technical question to cross-verify across dual AI engines... (e.g. What are the key legal compliance requirements for AI data residency under current regulations?)"
          rows={3}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 resize-none focus:outline-none focus:border-orange-500/50 leading-relaxed font-mono"
        />

        {/* Quick Sample Queries */}
        <div className="pt-1">
          <div className="text-[10px] font-mono text-slate-500 mb-1.5 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Sample fact verification queries (click to fill):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_FACT_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(sample)}
                className="text-[10px] text-left px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 cursor-pointer transition-colors max-w-full truncate"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Error Card */}
      {error && (
        <div className="p-4 bg-slate-950/90 border border-amber-500/40 rounded-xl text-slate-200 text-xs space-y-3 animate-in fade-in shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="font-semibold text-amber-300 font-mono text-xs flex items-center gap-2">
                <span>Verification Request Notice</span>
              </span>
              <p className="text-slate-300 leading-relaxed text-xs">{error}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 flex-wrap">
            <button
              type="button"
              onClick={runCheck}
              disabled={loading || !prompt.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Retry Check</span>
            </button>

            <button
              type="button"
              onClick={setZeroConfigPair}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Switch to Instant Zero-Config Pair</span>
            </button>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("credentials")}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-slate-100 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer transition-colors ml-auto"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Configure Keys & Subscriptions</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results Dashboard */}
      {result && (
        <div className="space-y-6 animate-in fade-in">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Agreement Score</span>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1 flex items-baseline gap-1">
                {result.comparison?.agreementScore !== null && result.comparison?.agreementScore !== undefined
                  ? `${result.comparison.agreementScore}%`
                  : "N/A"}
                <span className="text-[10px] font-normal text-slate-400">congruence</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Contradictions</span>
              <div className="text-2xl font-bold font-mono mt-1 flex items-baseline gap-1">
                <span className={(result.comparison?.highImpactContradictionCount || 0) > 0 ? "text-orange-400" : "text-emerald-400"}>
                  {result.comparison?.highImpactContradictionCount || 0}
                </span>
                <span className="text-[10px] font-normal text-slate-400">high-impact</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Total Execution Cost</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1 flex items-baseline gap-1">
                ${(result.totalCostUsd || 0).toFixed(4)}
                <span className="text-[10px] font-normal text-slate-400">USD (both runs)</span>
              </div>
            </div>
          </div>

          {/* Synthesis Recommendation */}
          {result.recommendation && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Synthesis & Grounded Verdict:</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed pl-5">
                {result.recommendation}
              </p>
            </div>
          )}

          {/* Contradictions List */}
          {result.comparison?.contradictions?.length > 0 && (
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <p className="text-xs font-bold font-mono text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Detected Fact Discrepancies ({result.comparison.contradictions.length})
              </p>
              <div className="space-y-1.5">
                {result.comparison.contradictions.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                      c.impact === "high" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {c.impact}
                    </span>
                    <span>{c.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model Responses Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
                <span className="text-orange-400 font-bold flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> {modelA.label}
                </span>
                <span className="text-slate-500 text-[10px]">${(result.responseA?.costUsd || 0).toFixed(4)}</span>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {result.responseA?.text}
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> {modelB.label}
                </span>
                <span className="text-slate-500 text-[10px]">${(result.responseB?.costUsd || 0).toFixed(4)}</span>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {result.responseB?.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
