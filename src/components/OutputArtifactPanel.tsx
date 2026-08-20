import { useEffect, useState } from "react";
import { Download, FileText, Table, Image as ImageIcon, Eye } from "lucide-react";

export type OutputFormat = "auto" | "text" | "pdf" | "xlsx" | "image";

export interface OutputArtifact {
  format: "pdf" | "xlsx" | "image";
  filename?: string;
  fileName?: string;
  mimeType: string;
  base64?: string;
  base64Data?: string;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  try {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  } catch (err) {
    console.warn("Base64 decoding failed:", err);
    return new Blob([], { type: mimeType });
  }
}

export default function OutputArtifactPanel({ artifact }: { artifact: OutputArtifact }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const rawBase64 = artifact?.base64 || artifact?.base64Data || "";
  const displayName = artifact?.filename || artifact?.fileName || `output.${artifact?.format || "dat"}`;

  useEffect(() => {
    if (!rawBase64) return;
    const blob = base64ToBlob(rawBase64, artifact.mimeType);
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [rawBase64, artifact?.mimeType]);

  if (!rawBase64 || !artifact) return null;

  return (
    <div className="border border-orange-500/30 rounded-xl bg-slate-950/90 overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {artifact.format === "pdf" && <FileText className="w-4 h-4 text-orange-400" />}
          {artifact.format === "xlsx" && <Table className="w-4 h-4 text-emerald-400" />}
          {artifact.format === "image" && <ImageIcon className="w-4 h-4 text-cyan-400" />}
          <span className="text-xs font-mono font-semibold text-slate-200">{displayName}</span>
        </div>
        
        {objectUrl && (
          <a
            href={objectUrl}
            download={displayName}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 rounded-lg text-xs font-bold shadow hover:brightness-110 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Artifact</span>
          </a>
        )}
      </div>

      {artifact.format === "pdf" && objectUrl && (
        <div className="p-2 bg-slate-950">
          <embed src={objectUrl} type="application/pdf" className="w-full rounded-lg" style={{ height: "420px" }} />
        </div>
      )}

      {artifact.format === "image" && objectUrl && (
        <div className="p-4 flex justify-center bg-slate-950">
          <img src={objectUrl} alt={displayName} className="max-w-full max-h-[420px] rounded-lg border border-slate-800 shadow-lg object-contain" />
        </div>
      )}

      {artifact.format === "xlsx" && (
        <XlsxPreview blob={base64ToBlob(rawBase64, artifact.mimeType)} />
      )}
    </div>
  );
}

function XlsxPreview({ blob }: { blob: Blob }) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const XLSX = await import("xlsx");
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
        if (!cancelled) setRows(data.slice(0, 25));
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob]);

  if (error) {
    return (
      <div className="p-4 text-xs text-slate-400 font-mono text-center">
        Excel sheet generated successfully. Click download above to open in Excel or Google Sheets.
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="p-4 text-xs text-slate-500 font-mono text-center">
        Parsing spreadsheet preview…
      </div>
    );
  }

  const [header, ...body] = rows;
  return (
    <div className="overflow-x-auto max-h-72 p-2">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="bg-slate-900 border-b border-slate-800">
            {header?.map((h, i) => (
              <th key={i} className="px-3 py-2 font-mono text-orange-300 font-semibold border-r border-slate-800/60 last:border-r-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {body.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-900/40">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1.5 text-slate-300 font-mono border-r border-slate-800/40 last:border-r-0">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
