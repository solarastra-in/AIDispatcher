import { useState } from "react";
import { authedFetch } from "../lib/firebaseClient";
import { Layers, Plus, X, Sparkles, RefreshCw, Cpu, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

interface RelayModelStep {
  provider: string;
  modelId: string;
  label: string;
}

interface RelayRound {
  roundNumber: number;
  provider: string;
  modelId: string;
  output: string;
  costUsd: number;
  changeFromPreviousPercent: number | null;
}

interface RelayResult {
  rounds: RelayRound[];
  finalOutput: string;
  totalCostUsd: number;
  totalRounds: number;
  diminishingReturnsDetected: boolean;
}

const AVAILABLE_MODELS: RelayModelStep[] = [
  { provider: "google", modelId: "gemini-3.7-flash", label: "Gemini 3.7 Flash (Ready)" },
  { provider: "google", modelId: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (Ready)" },
  { provider: "google", modelId: "gemini-flash-latest", label: "Gemini Flash Latest (Ready)" },
  { provider: "openai", modelId: "openai-subscription-gpt4o", label: "ChatGPT Pro (Subscription $0/tok)" },
  { provider: "anthropic", modelId: "claude-subscription-sonnet", label: "Claude Pro (Subscription $0/tok)" },
  { provider: "openai", modelId: "gpt-4o", label: "GPT-4o (BYOK Key)" },
  { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (BYOK Key)" },
  { provider: "deepseek", modelId: "deepseek-chat", label: "DeepSeek V3 (BYOK Key)" },
  { provider: "mistral", modelId: "mistral-large-latest", label: "Mistral Large (BYOK Key)" },
];

export default function RelayPanel() {
  const [data, setData] = useState("");
  const [instruction, setInstruction] = useState("");
  const [chain, setChain] = useState<RelayModelStep[]>([AVAILABLE_MODELS[0], AVAILABLE_MODELS[1]]);
  const [result, setResult] = useState<RelayResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addToChain(model: RelayModelStep) {
    if (chain.length >= 5) return;
    setChain([...chain, model]);
  }

  function removeFromChain(index: number) {
    setChain(chain.filter((_, i) => i !== index));
  }

  async function run() {
    if (!data.trim() || chain.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await authedFetch("/api/dispatch/relay", {
        method: "POST",
        body: JSON.stringify({
          data,
          instruction,
          modelChain: chain.map(({ provider, modelId }) => ({ provider, modelId })),
        }),
      });
      const contentType = res.headers.get("content-type") || "";
      let json: any;
      if (contentType.includes("application/json")) {
        json = await res.json();
      } else {
        const rawText = await res.text();
        throw new Error(`Server returned status ${res.status}: ${rawText.slice(0, 160)}`);
      }
      if (!res.ok || json.error) {
        setError(json.error || "Relay pipeline execution failed. Please verify provider connectivity.");
      } else {
        setResult(json);
      }
    } catch (e: any) {
      setError(e.message || "Failed to execute sequential multi-model relay.");
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
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase tracking-wider">
              Sequential Pipeline
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Iterative Polish
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-display text-slate-100 mt-2 flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-400" />
            WhyOr Relay — Multi-Engine Sequential Refinement
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Passes prompt outputs sequentially through a configured chain of specialized models, with each model refining and building upon the previous stage.
          </p>
        </div>

        <button
          onClick={run}
          disabled={loading || !data.trim() || chain.length === 0}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 disabled:opacity-40 transition-all cursor-pointer shrink-0"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{loading ? "Relaying Across Chain…" : "Execute Relay"}</span>
        </button>
      </div>

      {/* Input Data & Instruction */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-mono text-slate-300 font-semibold">
              Initial Source Text or Prompt Draft:
            </label>
            <span className="text-[11px] font-mono text-slate-500">{data.length} chars</span>
          </div>

          <div className="mb-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.06] text-[11px] text-slate-300 leading-relaxed">
            <span className="font-semibold text-orange-300 font-mono">What goes in this box:</span> Enter or paste the raw source text, contract clause, draft memo, technical code snippet, or dataset to be iteratively processed through each model stage in your configured chain.
          </div>

          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Paste your source text, contract clause, draft, or data to refine... (e.g. Contract Amendment Clause 14.2: In the event of logistics disruption...)"
            rows={3}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 resize-none focus:outline-none focus:border-orange-500/50 leading-relaxed font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 font-semibold mb-1.5">
            Refinement Directive (Applied at each sequential stage):
          </label>

          <div className="mb-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.06] text-[11px] text-slate-300 leading-relaxed">
            <span className="font-semibold text-cyan-300 font-mono">What goes in this box:</span> Specify what transformation or critique each model in the pipeline should perform (e.g., 'Step 1: Critique ambiguities, Step 2: Tighten clauses, Step 3: Draft an executive bullet summary').
          </div>

          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Critique ambiguities, tighten legal clauses, and draft an executive bullet summary"
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 font-mono"
          />
        </div>
      </div>

      {/* Chain Builder */}
      <div className="space-y-3 p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-orange-400" />
            Configured Model Pipeline ({chain.length} Stage{chain.length !== 1 ? "s" : ""})
          </span>
          <span className="text-[10px] font-mono text-slate-500">Max 5 stages</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {chain.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-slate-900 border border-orange-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-200 shadow-sm"
            >
              <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-mono font-bold">
                {i + 1}
              </span>
              <span className="font-semibold">{m.label}</span>
              <button
                onClick={() => removeFromChain(i)}
                className="text-slate-500 hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer"
                title="Remove stage"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-slate-500 mr-1">Add Stage:</span>
          {AVAILABLE_MODELS.map((m) => (
            <button
              key={m.modelId}
              onClick={() => addToChain(m)}
              disabled={chain.length >= 5}
              className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 rounded-lg transition-all disabled:opacity-30 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-orange-400" />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Dashboard */}
      {result && (
        <div className="space-y-5 animate-in fade-in pt-2">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Rounds Executed</span>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                {result.totalRounds} Stages
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Cumulative Cost</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                ${(result.totalCostUsd || 0).toFixed(4)}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Convergence Status</span>
              <div className="text-sm font-semibold mt-2 flex items-center gap-1.5">
                {result.diminishingReturnsDetected ? (
                  <span className="text-amber-400 flex items-center gap-1 font-mono text-xs">
                    ⚡ Converged (Diminishing delta)
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High incremental gain
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Final Output Highlight Card */}
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-orange-400 font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Final Synthesized Output (Stage {result.totalRounds}):
              </span>
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-100 whitespace-pre-wrap leading-relaxed">
              {result.finalOutput}
            </div>
          </div>

          {/* Stage by stage intermediate outputs */}
          <div className="space-y-2">
            <p className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
              Stage Breakdown & Delta Progression:
            </p>
            <div className="space-y-2">
              {result.rounds?.map((r) => (
                <details
                  key={r.roundNumber}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs group"
                >
                  <summary className="cursor-pointer font-mono flex items-center justify-between text-slate-300 group-hover:text-orange-300">
                    <span className="font-bold">
                      Round {r.roundNumber}: {r.modelId}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {r.changeFromPreviousPercent === null ? "Initial Baseline" : `${r.changeFromPreviousPercent}% text variance`}
                    </span>
                  </summary>
                  <p className="mt-3 text-slate-300 whitespace-pre-wrap p-3 rounded bg-slate-900/60 border border-slate-800/60 leading-relaxed">
                    {r.output}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
