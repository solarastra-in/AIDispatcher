import { useEffect, useState } from "react";
import { authedFetch } from "../lib/firebaseClient";
import { Database, ChevronDown, ChevronRight, Zap, Sparkles } from "lucide-react";

interface ContextPreview {
  hasCompressedSummary: boolean;
  compressedSummary: string | null;
  verbatimTurns: { role: string; content: string }[];
  estimatedTokensIfSentNow: number;
  cumulativeTokensSaved: number;
  compressionEventCount: number;
}

export default function ContextPreviewPanel({ sessionId }: { sessionId: string }) {
  const [preview, setPreview] = useState<ContextPreview | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || !sessionId) return;
    authedFetch(`/api/chat/sessions/${sessionId}/context-preview`)
      .then((r) => r.json())
      .then(setPreview)
      .catch(() => setPreview(null));
  }, [open, sessionId]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-3.5 py-2 text-xs text-slate-400 hover:text-slate-200 font-mono flex items-center justify-between transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-orange-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          <Database className="w-3.5 h-3.5 text-orange-400" />
          <span>Active Context Ledger & Memory Payload</span>
        </div>
        {preview && preview.cumulativeTokensSaved > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            ⚡ ~{preview.cumulativeTokensSaved} tokens saved
          </span>
        )}
      </button>

      {open && (
        <div className="p-3.5 border-t border-slate-800 text-xs space-y-3 bg-slate-950/90 animate-in fade-in">
          {preview ? (
            <>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono flex-wrap gap-2 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Zap className="w-3 h-3" /> ~{preview.estimatedTokensIfSentNow} tokens in current payload
                </span>
                <span className="text-slate-500">
                  {preview.compressionEventCount} semantic condensation event{preview.compressionEventCount !== 1 ? "s" : ""}
                </span>
              </div>

              {preview.hasCompressedSummary && (
                <div>
                  <p className="text-[10px] text-orange-400 font-mono uppercase tracking-wider mb-1 flex items-center gap-1 font-bold">
                    <Sparkles className="w-3 h-3" /> Condensed Context Snapshot
                  </p>
                  <p className="text-slate-300 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs whitespace-pre-wrap leading-relaxed">
                    {preview.compressedSummary}
                  </p>
                </div>
              )}

              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">
                  Recent Turn History (Verbatim)
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {preview.verbatimTurns.length === 0 ? (
                    <p className="text-slate-600 text-[11px]">No previous turns recorded.</p>
                  ) : (
                    preview.verbatimTurns.map((t, i) => (
                      <div key={i} className="p-2 rounded bg-slate-900/60 border border-slate-800/80 text-[11px]">
                        <span className="font-mono font-bold text-slate-400 uppercase text-[10px] mr-2">
                          [{t.role}]:
                        </span>
                        <span className="text-slate-300">
                          {t.content.slice(0, 160)}
                          {t.content.length > 160 ? "…" : ""}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-500 font-mono text-[11px]">Loading context details…</p>
          )}
        </div>
      )}
    </div>
  );
}
