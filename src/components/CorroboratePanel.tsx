import { useState } from "react";
import { authedFetch } from "../lib/firebaseClient";
import { GitCompare, Sparkles, AlertTriangle, CheckCircle2, Cpu, ArrowRight, RefreshCw, Layers } from "lucide-react";

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

export default function CorroboratePanel({
  prompt: initialPrompt,
  modelA,
  modelB,
}: {
  prompt?: string;
  modelA: { provider: string; modelId: string; label: string };
  modelB: { provider: string; modelId: string; label: string };
}) {
  const [prompt, setPrompt] = useState(
    initialPrompt || "What are the key legal compliance requirements for AI data residency in the EU under the EU AI Act 2026?"
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
        body: JSON.stringify({ prompt, modelA, modelB }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Cross-model corroboration failed. Please check provider connection.");
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e.message || "Failed to execute cross-model corroboration.");
    } finally {
      setLoading(false);
    }
  }

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
            <span className="text-cyan-300 font-semibold">{modelB.label}</span>, extracting factual claims and surfacing contradictions.
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

      {/* Prompt Input */}
      <div className="space-y-2">
        <label className="block text-xs font-mono text-slate-400">
          Target Question or Claim to Corroborate:
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter statement or technical question to cross-verify across frontier AI models..."
          rows={3}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 resize-none focus:outline-none focus:border-orange-500/50 leading-relaxed"
        />
      </div>

      {/* Error Message if any */}
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
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
