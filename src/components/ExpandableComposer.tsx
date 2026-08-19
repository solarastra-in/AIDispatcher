import React, { useRef, useState, useEffect } from "react";
import { authedFetch } from "../lib/firebaseClient";
import type { OutputFormat } from "./OutputArtifactPanel";

interface RedraftBenefit {
  originalEstTokens: number;
  redraftedEstTokens: number;
  tokenDelta: number;
  percentChange: number;
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "text", label: "Text" },
  { value: "pdf", label: "PDF" },
  { value: "xlsx", label: "Excel" },
  { value: "image", label: "Image" },
];

export default function ExpandableComposer({
  sessionId,
  onSend,
}: {
  sessionId: string;
  onSend: (effectivePrompt: string, rawUserPrompt: string, outputFormat: OutputFormat) => void;
}) {
  const [draft, setDraft] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("auto");
  const [redrafting, setRedrafting] = useState(false);
  const [redraftSuggestion, setRedraftSuggestion] = useState<string | null>(null);
  const [redraftBenefit, setRedraftBenefit] = useState<RedraftBenefit | null>(null);
  const [redraftError, setRedraftError] = useState<string | null>(null);
  const [compressionNote, setCompressionNote] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = fullscreen ? window.innerHeight - 220 : 480;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [draft, fullscreen]);

  async function handleRedraft() {
    if (!draft.trim()) return;
    setRedrafting(true);
    setRedraftError(null);
    setRedraftSuggestion(null);
    setRedraftBenefit(null);
    try {
      const res = await authedFetch("/api/prompt/redraft", { method: "POST", body: JSON.stringify({ prompt: draft, sessionId }) });
      const data = await res.json();
      if (!res.ok) {
        setRedraftError(data.error || "Redraft failed — your original prompt is unchanged.");
      } else {
        setRedraftSuggestion(data.redrafted);
        setRedraftBenefit(data.benefit);
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
    setRedraftBenefit(null);
  }

  async function handleSend() {
    if (!draft.trim()) return;
    const rawUserPrompt = draft;
    let effectivePrompt = rawUserPrompt;

    try {
      const res = await authedFetch(`/api/chat/${sessionId}/compressed-prompt`, {
        method: "POST",
        body: JSON.stringify({ userPrompt: rawUserPrompt }),
      });
      const data = await res.json();
      if (data.compressed) {
        setCompressionNote(`Older context compressed: ~${data.tokensBefore} → ~${data.tokensAfter} tokens this turn (~${data.cumulativeTokensSaved} saved total).`);
      }
      if (data.effectivePrompt) {
        effectivePrompt = data.effectivePrompt;
      }
    } catch (err) {
      console.warn("Context compression error:", err);
    }

    onSend(effectivePrompt, rawUserPrompt, outputFormat);
    setDraft("");
    setFullscreen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className={`border border-[#2A2F38] rounded bg-[#171B21] p-4 flex flex-col ${
        fullscreen ? "fixed inset-4 z-50 shadow-2xl" : "relative"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setOutputFormat(opt.value)}
              className={`text-[11px] px-2.5 py-1 rounded font-mono cursor-pointer ${
                outputFormat === opt.value ? "bg-[#FF8A3D] text-[#171208]" : "bg-[#1D222A] text-[#93999F]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={() => setFullscreen((f) => !f)} className="text-[11px] text-[#5B6169] hover:text-[#93999F] cursor-pointer">
          {fullscreen ? "⤡ Collapse" : "⤢ Expand"}
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your prompt… (⌘/Ctrl+Enter to send)"
        rows={6}
        className="w-full bg-transparent text-sm resize-none focus:outline-none flex-1 min-h-[100px]"
      />

      {redraftSuggestion && (
        <div className="mt-3 border border-[#FF8A3D]/40 rounded bg-[#1D222A] p-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] text-[#93999F] font-mono">SUGGESTED REDRAFT</p>
            {redraftBenefit && (
              <p className={`text-[11px] font-mono ${redraftBenefit.tokenDelta <= 0 ? "text-[#4FD1C5]" : "text-[#FF8A3D]"}`}>
                {redraftBenefit.tokenDelta <= 0 ? "▾" : "▴"} {Math.abs(redraftBenefit.percentChange)}%
                {" "}({redraftBenefit.originalEstTokens} → {redraftBenefit.redraftedEstTokens} tokens)
              </p>
            )}
          </div>
          <p className="text-sm mb-3 whitespace-pre-wrap">{redraftSuggestion}</p>
          <div className="flex gap-2">
            <button onClick={acceptRedraft} className="px-3 py-1.5 bg-[#FF8A3D] text-[#171208] rounded text-xs font-medium cursor-pointer">Use this version</button>
            <button onClick={() => { setRedraftSuggestion(null); setRedraftBenefit(null); }} className="px-3 py-1.5 bg-[#2A2F38] text-[#93999F] rounded text-xs cursor-pointer">Keep my original</button>
          </div>
        </div>
      )}
      {redraftError && <p className="text-xs text-red-400 mt-2">{redraftError}</p>}

      <div className="flex items-center justify-between mt-3">
        <button onClick={handleRedraft} disabled={!draft.trim() || redrafting} className="text-xs text-[#93999F] hover:text-[#E7E9EC] disabled:opacity-30 cursor-pointer">
          {redrafting ? "Redrafting…" : "✎ Redraft with AI"}
        </button>
        <button onClick={handleSend} disabled={!draft.trim()} className="px-4 py-2 bg-[#FF8A3D] text-[#171208] rounded text-sm font-medium disabled:opacity-40 hover:bg-[#ffa15e] cursor-pointer">
          Send
        </button>
      </div>

      {compressionNote && <p className="text-[11px] text-[#5B6169] mt-2 font-mono">{compressionNote}</p>}
    </div>
  );
}
