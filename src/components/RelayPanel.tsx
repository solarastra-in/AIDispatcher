import { useState } from "react";
import { authedFetch } from "../lib/firebaseClient";

interface RelayModelStep { provider: string; modelId: string; label: string }
interface RelayRound {
  roundNumber: number; provider: string; modelId: string; output: string;
  costUsd: number; changeFromPreviousPercent: number | null;
}
interface RelayResult {
  rounds: RelayRound[]; finalOutput: string; totalCostUsd: number;
  totalRounds: number; diminishingReturnsDetected: boolean;
}

const AVAILABLE_MODELS: RelayModelStep[] = [
  { provider: "openai", modelId: "gpt-4o", label: "GPT-4o" },
  { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  { provider: "google", modelId: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { provider: "deepseek", modelId: "deepseek-chat", label: "DeepSeek V3" },
];

export default function RelayPanel() {
  const [data, setData] = useState("");
  const [instruction, setInstruction] = useState("Reformat this as a polished summary");
  const [chain, setChain] = useState<RelayModelStep[]>([AVAILABLE_MODELS[0], AVAILABLE_MODELS[1]]);
  const [result, setResult] = useState<RelayResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addToChain(model: RelayModelStep) {
    if (chain.length >= 6) return;
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
        body: JSON.stringify({ data, instruction, modelChain: chain.map(({ provider, modelId }) => ({ provider, modelId })) }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || "Relay failed");
      else setResult(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-[#2A2F38] rounded bg-[#171B21] p-5">
      <h3 className="text-sm font-semibold mb-1">WhyOr Relay</h3>
      <p className="text-[11px] text-[#93999F] mb-4">
        First model generates from your data; each model after it refines the previous output.
      </p>

      <textarea
        value={data}
        onChange={(e) => setData(e.target.value)}
        placeholder="Paste your data here…"
        rows={4}
        className="w-full bg-[#1D222A] border border-[#2A2F38] rounded p-3 text-sm resize-none mb-2"
      />
      <input
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        className="w-full bg-[#1D222A] border border-[#2A2F38] rounded p-2.5 text-sm mb-3"
      />

      <p className="text-[11px] font-mono text-[#93999F] mb-1.5">CHAIN ({chain.length} round{chain.length !== 1 ? "s" : ""})</p>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {chain.map((m, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-[#1D222A] border border-[#2A2F38] rounded px-2.5 py-1.5 text-xs">
            <span className="font-mono text-[#5B6169]">{i + 1}</span>
            {m.label}
            <button onClick={() => removeFromChain(i)} className="text-[#5B6169] hover:text-red-400 ml-1 cursor-pointer">×</button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {AVAILABLE_MODELS.map((m) => (
          <button
            key={m.modelId}
            onClick={() => addToChain(m)}
            disabled={chain.length >= 6}
            className="text-[11px] px-2.5 py-1 border border-[#2A2F38] rounded text-[#93999F] hover:text-[#E7E9EC] hover:border-[#93999F] disabled:opacity-30 cursor-pointer"
          >
            + {m.label}
          </button>
        ))}
      </div>

      <button
        onClick={run}
        disabled={loading || !data.trim() || chain.length === 0}
        className="px-4 py-2 bg-[#FF8A3D] text-[#171208] rounded text-sm font-medium disabled:opacity-40 hover:bg-[#ffa15e] cursor-pointer"
      >
        {loading ? "Running relay…" : "Run relay"}
      </button>

      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

      {result && (
        <div className="mt-5">
          <div className="flex items-center gap-6 mb-4">
            <div><div className="font-mono text-lg">{result.totalRounds}</div><div className="text-[10px] text-[#93999F]">rounds run</div></div>
            <div><div className="font-mono text-lg">${(result.totalCostUsd || 0).toFixed(4)}</div><div className="text-[10px] text-[#93999F]">total cost</div></div>
            {result.diminishingReturnsDetected && (
              <div className="text-[11px] text-[#FF8A3D] bg-[#FF8A3D]/10 px-2.5 py-1.5 rounded">
                Diminishing returns — the last round barely changed the output
              </div>
            )}
          </div>

          <div className="space-y-2 mb-4">
            {result.rounds?.map((r) => (
              <details key={r.roundNumber} className="bg-[#1D222A] border border-[#2A2F38] rounded p-3">
                <summary className="text-xs cursor-pointer flex items-center justify-between">
                  <span>Round {r.roundNumber} — {r.modelId}</span>
                  <span className="font-mono text-[#5B6169]">
                    {r.changeFromPreviousPercent === null ? "initial" : `${r.changeFromPreviousPercent}% changed`}
                  </span>
                </summary>
                <p className="text-xs mt-2 whitespace-pre-wrap text-[#E7E9EC]">{r.output}</p>
              </details>
            ))}
          </div>

          <p className="text-[11px] font-mono text-[#93999F] mb-1.5">FINAL OUTPUT</p>
          <p className="text-sm whitespace-pre-wrap bg-[#1D222A] border border-[#2A2F38] rounded p-3">{result.finalOutput}</p>
        </div>
      )}
    </div>
  );
}
