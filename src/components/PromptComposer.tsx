/**
 * src/components/PromptComposer.tsx
 *
 * The actual chat input. Two additions beyond a plain textarea:
 *   - "Redraft with AI" — opt-in, shows a suggested rewrite the user must
 *     explicitly accept before it replaces their draft. Never auto-applied.
 *   - A quiet token-budget indicator once compression has kicked in for
 *     this session, so the user can see it's working rather than wonder
 *     why older context "disappeared."
 */
import { useState } from "react";

export default function PromptComposer({
  sessionId,
  onSend,
}: {
  sessionId: string;
  onSend: (effectivePrompt: string, rawUserPrompt: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [redrafting, setRedrafting] = useState(false);
  const [redraftSuggestion, setRedraftSuggestion] = useState<string | null>(null);
  const [redraftError, setRedraftError] = useState<string | null>(null);
  const [compressionNote, setCompressionNote] = useState<string | null>(null);

  async function handleRedraft() {
    if (!draft.trim()) return;
    setRedrafting(true);
    setRedraftError(null);
    setRedraftSuggestion(null);
    try {
      const res = await fetch("/api/prompt/redraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRedraftError(data.error || "Redraft failed — your original prompt is unchanged.");
      } else {
        setRedraftSuggestion(data.redrafted);
      }
    } catch (e: any) {
      setRedraftError(e.message);
    } finally {
      setRedrafting(false);
    }
  }

  function acceptRedraft() {
    if (redraftSuggestion) setDraft(redraftSuggestion);
    setRedraftSuggestion(null);
  }

  async function handleSend() {
    if (!draft.trim()) return;
    const rawUserPrompt = draft;

    // Get the (possibly compressed) effective prompt for this turn before
    // dispatching — this is what actually gets sent to the routed model,
    // not the raw draft, once a session has accumulated enough history to
    // trigger compression.
    try {
      const res = await fetch(`/api/chat/${sessionId}/compressed-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: rawUserPrompt }),
      });
      const data = await res.json();

      if (data.compressed) {
        setCompressionNote(
          `Older context compressed: ~${data.tokensBefore} → ~${data.tokensAfter} tokens for this turn.`
        );
      }

      onSend(data.effectivePrompt || rawUserPrompt, rawUserPrompt);
    } catch {
      onSend(rawUserPrompt, rawUserPrompt);
    }
    setDraft("");
  }

  return (
    <div className="border border-[#2A2F38] rounded bg-[#171B21] p-4">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Enter your prompt, complex question, or analysis task here..."
        rows={4}
        className="w-full bg-transparent text-sm resize-none focus:outline-none"
      />

      {redraftSuggestion && (
        <div className="mt-3 border border-[#FF8A3D]/40 rounded bg-[#1D222A] p-3">
          <p className="text-[11px] text-[#93999F] mb-1.5 font-mono">SUGGESTED REDRAFT</p>
          <p className="text-sm mb-3">{redraftSuggestion}</p>
          <div className="flex gap-2">
            <button onClick={acceptRedraft} className="px-3 py-1.5 bg-[#FF8A3D] text-[#171208] rounded text-xs font-medium">
              Use this version
            </button>
            <button onClick={() => setRedraftSuggestion(null)} className="px-3 py-1.5 bg-[#2A2F38] text-[#93999F] rounded text-xs">
              Keep my original
            </button>
          </div>
        </div>
      )}
      {redraftError && <p className="text-xs text-red-400 mt-2">{redraftError}</p>}

      <div className="flex items-center justify-between mt-3">
        <button
          onClick={handleRedraft}
          disabled={!draft.trim() || redrafting}
          className="text-xs text-[#93999F] hover:text-[#E7E9EC] disabled:opacity-30"
        >
          {redrafting ? "Redrafting…" : "✎ Redraft with AI"}
        </button>
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          className="px-4 py-2 bg-[#FF8A3D] text-[#171208] rounded text-sm font-medium disabled:opacity-40"
        >
          Send
        </button>
      </div>

      {compressionNote && <p className="text-[11px] text-[#5B6169] mt-2 font-mono">{compressionNote}</p>}
    </div>
  );
}
