import { useEffect, useState } from "react";

export type OutputFormat = "auto" | "text" | "pdf" | "xlsx" | "image";

export interface OutputArtifact {
  format: "pdf" | "xlsx" | "image";
  filename: string;
  mimeType: string;
  base64: string;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

export default function OutputArtifactPanel({ artifact }: { artifact: OutputArtifact }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!artifact?.base64) return;
    const blob = base64ToBlob(artifact.base64, artifact.mimeType);
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [artifact?.base64, artifact?.mimeType]);

  if (!objectUrl || !artifact) return null;

  return (
    <div className="border border-[#2A2F38] rounded bg-[#171B21] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2A2F38]">
        <span className="text-xs font-mono text-[#93999F]">{artifact.filename}</span>
        <a href={objectUrl} download={artifact.filename} className="text-[11px] text-[#FF8A3D] hover:underline cursor-pointer">
          ↓ Download
        </a>
      </div>

      {artifact.format === "pdf" && (
        <embed src={objectUrl} type="application/pdf" className="w-full" style={{ height: "450px" }} />
      )}

      {artifact.format === "image" && (
        <div className="p-4 flex justify-center bg-[#0F1216]">
          <img src={objectUrl} alt={artifact.filename} className="max-w-full max-h-[450px] rounded" />
        </div>
      )}

      {artifact.format === "xlsx" && <XlsxPreview blob={base64ToBlob(artifact.base64, artifact.mimeType)} />}
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
        if (!cancelled) setRows(data.slice(0, 21));
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [blob]);

  if (error) return <p className="p-3 text-xs text-[#5B6169]">Preview unavailable — download to view.</p>;
  if (!rows) return <p className="p-3 text-xs text-[#5B6169]">Loading preview…</p>;

  const [header, ...body] = rows;
  return (
    <div className="overflow-x-auto max-h-80">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#1D222A]">
            {header?.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 font-mono text-[#93999F] border-b border-[#2A2F38]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-[#2A2F38]/50">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1.5 text-[#E7E9EC]">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
