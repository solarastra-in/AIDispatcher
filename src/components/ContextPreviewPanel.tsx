import { useEffect, useState } from "react";
import { authedFetch } from "../lib/firebaseClient";

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
    <div className="border border-[#2A2F38] rounded bg-[#171B21]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-3 py-2 text-[11px] text-[#93999F] font-mono flex items-center justify-between cursor-pointer"
      >
        <span>{open ? "▾" : "▸"} View context being sent with this chat</span>
        {preview && preview.cumulativeTokensSaved > 0 && (
          <span className="text-[#4FD1C5]">compression saved ~{preview.cumulativeTokensSaved} tok this chat</span>
        )}
      </button>

      {open && preview && (
        <div className="px-3 pb-3 text-xs">
          <div className="flex justify-between text-[11px] text-[#5B6169] font-mono mb-2">
            <span>~{preview.estimatedTokensIfSentNow} tokens would be sent</span>
            <span>{preview.compressionEventCount} compression event(s) so far</span>
          </div>

          {preview.hasCompressedSummary && (
            <div className="mb-2">
              <p className="text-[10px] text-[#5B6169] font-mono mb-1">CONDENSED EARLIER CONTEXT</p>
              <p className="text-[#93999F] bg-[#1D222A] rounded p-2 whitespace-pre-wrap">{preview.compressedSummary}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] text-[#5B6169] font-mono mb-1">RECENT TURNS (VERBATIM)</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {preview.verbatimTurns.map((t, i) => (
                <p key={i} className="text-[#93999F]">
                  <span className="text-[#5B6169] font-mono">{t.role}:</span> {t.content.slice(0, 140)}{t.content.length > 140 ? "…" : ""}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
