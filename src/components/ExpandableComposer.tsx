import React, { useRef, useState, useEffect } from "react";
import { authedFetch } from "../lib/firebaseClient";
import type { OutputFormat } from "./OutputArtifactPanel";
import { 
  Sparkles, 
  Send, 
  Maximize2, 
  Minimize2, 
  Check, 
  X, 
  FileText, 
  Table, 
  Image as ImageIcon, 
  Cpu, 
  AlertCircle,
  Clock,
  ArrowRight
} from "lucide-react";

interface RedraftBenefit {
  originalEstTokens: number;
  redraftedEstTokens: number;
  tokenDelta: number;
  percentChange: number;
}

const FORMAT_OPTIONS: { value: OutputFormat; label: string; icon: any }[] = [
  { value: "auto", label: "Auto (Smart)", icon: Cpu },
  { value: "text", label: "Markdown Text", icon: FileText },
  { value: "pdf", label: "PDF Document", icon: FileText },
  { value: "xlsx", label: "Excel (.xlsx)", icon: Table },
  { value: "image", label: "Image Gen", icon: ImageIcon },
];

export default function ExpandableComposer({
  sessionId,
  onSend,
  initialDraft,
}: {
  sessionId: string;
  onSend: (effectivePrompt: string, rawUserPrompt: string, outputFormat: OutputFormat) => void;
  initialDraft?: string;
}) {
  const [draft, setDraft] = useState(initialDraft || "");
  const [fullscreen, setFullscreen] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("auto");
  const [redrafting, setRedrafting] = useState(false);
  const [redraftSuggestion, setRedraftSuggestion] = useState<string | null>(null);
  const [redraftBenefit, setRedraftBenefit] = useState<RedraftBenefit | null>(null);
  const [redraftError, setRedraftError] = useState<string | null>(null);
  const [compressionNote, setCompressionNote] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialDraft && initialDraft !== draft) {
      setDraft(initialDraft);
    }
  }, [initialDraft]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = fullscreen ? window.innerHeight - 240 : 380;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [draft, fullscreen]);

  async function handleRedraft() {
    if (!draft.trim()) return;
    setRedrafting(true);
    setRedraftError(null);
    setRedraftSuggestion(null);
    setRedraftBenefit(null);
    try {
      const res = await authedFetch("/api/prompt/redraft", {
        method: "POST",
        body: JSON.stringify({ prompt: draft, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRedraftError(data.error || "Prompt redrafting failed — your original prompt is retained.");
      } else {
        setRedraftSuggestion(data.redrafted);
        setRedraftBenefit(data.benefit);
      }
    } catch (e: any) {
      setRedraftError(e.message || "Failed to communicate with redrafting assistant.");
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
      if (sessionId) {
        const res = await authedFetch(`/api/chat/${sessionId}/compressed-prompt`, {
          method: "POST",
          body: JSON.stringify({ userPrompt: rawUserPrompt }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.compressed) {
            setCompressionNote(
              `⚡ Context optimized: ~${data.tokensBefore} → ~${data.tokensAfter} tokens (~${data.cumulativeTokensSaved} tokens saved cumulative)`
            );
          }
          if (data.effectivePrompt) {
            effectivePrompt = data.effectivePrompt;
          }
        }
      }
    } catch (err) {
      console.warn("Context compression notice:", err);
    }

    onSend(effectivePrompt, rawUserPrompt, outputFormat);
    setDraft("");
    setFullscreen(false);
    setRedraftSuggestion(null);
    setRedraftBenefit(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-inner flex flex-col transition-all ${
        fullscreen ? "fixed inset-6 z-50 shadow-2xl bg-slate-950 border-orange-500/30" : "relative"
      }`}
    >
      {/* Top Format Selector Ribbon */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-slate-500 mr-1">Target Output:</span>
          {FORMAT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = outputFormat === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setOutputFormat(opt.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/40 font-semibold shadow-sm"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3 h-3 text-orange-400" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setFullscreen((f) => !f)}
          className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
        >
          {fullscreen ? <Minimize2 className="w-3 h-3 text-orange-400" /> : <Maximize2 className="w-3 h-3 text-slate-400" />}
          <span>{fullscreen ? "Collapse" : "Expand"}</span>
        </button>
      </div>

      {/* Main Prompt Textarea */}
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your prompt, complex question, or analysis task... (Press ⌘+Enter or Ctrl+Enter to dispatch)"
        rows={fullscreen ? 12 : 4}
        className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-600 resize-none focus:outline-none flex-1 min-h-[90px] leading-relaxed"
      />

      {/* AI Redraft Suggestion Banner */}
      {redraftSuggestion && (
        <div className="mt-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-slate-200 animate-in fade-in space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-orange-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold text-orange-300 font-mono">
                AI Redrafted Version (Optimized for Tokens & Clarity)
              </span>
            </div>
            {redraftBenefit && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {redraftBenefit.tokenDelta <= 0 ? "↓" : "↑"} {Math.abs(redraftBenefit.percentChange)}% Tokens
                </span>
                <span className="text-slate-400 text-[11px]">
                  ({redraftBenefit.originalEstTokens} → {redraftBenefit.redraftedEstTokens} tok)
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-200 whitespace-pre-wrap bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            {redraftSuggestion}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={acceptRedraft}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 rounded-lg text-xs font-bold shadow-md cursor-pointer hover:brightness-110"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Use Redrafted Version</span>
            </button>
            <button
              onClick={() => {
                setRedraftSuggestion(null);
                setRedraftBenefit(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Keep Original Prompt</span>
            </button>
          </div>
        </div>
      )}

      {/* Redraft Error notice */}
      {redraftError && (
        <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{redraftError}</span>
        </div>
      )}

      {/* Bottom Action Ribbon */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRedraft}
            disabled={!draft.trim() || redrafting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-orange-300 bg-slate-900 border border-slate-800 hover:border-orange-500/30 transition-all disabled:opacity-30 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 text-orange-400 ${redrafting ? "animate-spin" : ""}`} />
            <span>{redrafting ? "Redrafting with AI…" : "Redraft with AI"}</span>
          </button>
          
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            ~{Math.max(1, Math.round(draft.length / 4))} est. tokens
          </span>
        </div>

        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 disabled:opacity-40 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Dispatch Prompt</span>
        </button>
      </div>

      {compressionNote && (
        <div className="mt-2 text-[10px] font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-800/30 px-3 py-1.5 rounded-md flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{compressionNote}</span>
        </div>
      )}
    </div>
  );
}
