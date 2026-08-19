import { useState } from "react";
import { authedFetch } from "../lib/firebaseClient";

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

const IMPACT_COLOR = { high: "#FF8A3D", medium: "#93999F", low: "#5B6169" };

export default function CorroboratePanel({
  prompt: initialPrompt,
  modelA,
  modelB,
}: {
  prompt?: string;
  modelA: { provider: string; modelId: string; label: string };
  modelB: { provider: string; modelId: string; label: string };
}) {
  const [prompt, setPrompt] = useState(initialPrompt || "");
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
        setError(data.error || "Corroboration failed");
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-[#2A2F38] rounded bg-[#171B21] p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">WhyOr Corroborate</h3>
          <p className="text-[11px] text-[#93999F] mt-0.5">
            Runs this prompt through both {modelA.label} and {modelB.label} and compares the facts each one states.
          </p>
        </div>
        <button
          onClick={runCheck}
          disabled={loading || !prompt.trim()}
          className="px-4 py-2 bg-[#FF8A3D] text-[#171208] rounded text-xs font-medium disabled:opacity-40 shrink-0 hover:bg-[#ffa15e] cursor-pointer"
        >
          {loading ? "Comparing…" : "Run corroboration"}
        </button>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter question or statement to verify across both models..."
        rows={3}
        className="w-full bg-[#1D222A] border border-[#2A2F38] rounded p-2.5 text-sm resize-none mb-3"
      />

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      {result && (
        <div className="mt-4">
          <div className="flex items-center gap-6 mb-4">
            <div>
              <div className="font-mono text-2xl">
                {result.comparison?.agreementScore !== null && result.comparison?.agreementScore !== undefined ? `${result.comparison.agreementScore}%` : "—"}
              </div>
              <div className="text-[10px] text-[#93999F]">cross-model agreement score</div>
            </div>
            <div>
              <div className="font-mono text-2xl" style={{ color: (result.comparison?.highImpactContradictionCount || 0) > 0 ? "#FF8A3D" : "#4FD1C5" }}>
                {result.comparison?.highImpactContradictionCount || 0}
              </div>
              <div className="text-[10px] text-[#93999F]">high-impact contradiction(s)</div>
            </div>
            <div>
              <div className="font-mono text-2xl">${(result.totalCostUsd || 0).toFixed(4)}</div>
              <div className="text-[10px] text-[#93999F]">total cost (both models)</div>
            </div>
          </div>

          <p className="text-xs text-[#E7E9EC] bg-[#1D222A] rounded p-3 mb-4">{result.recommendation}</p>

          {result.comparison?.contradictions?.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-mono text-[#93999F] mb-2">CONTRADICTIONS</p>
              {result.comparison.contradictions.map((c, i) => (
                <div key={i} className="text-xs py-1.5 border-t border-[#2A2F38] first:border-t-0">
                  <span className="font-mono text-[10px] mr-2" style={{ color: IMPACT_COLOR[c.impact] || "#93999F" }}>[{c.impact}]</span>
                  {c.note}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1D222A] p-3 rounded border border-[#2A2F38]">
              <p className="text-[11px] font-mono text-[#93999F] mb-1.5">{modelA.label}</p>
              <p className="text-xs text-[#E7E9EC] whitespace-pre-wrap">{result.responseA?.text}</p>
            </div>
            <div className="bg-[#1D222A] p-3 rounded border border-[#2A2F38]">
              <p className="text-[11px] font-mono text-[#93999F] mb-1.5">{modelB.label}</p>
              <p className="text-xs text-[#E7E9EC] whitespace-pre-wrap">{result.responseB?.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
