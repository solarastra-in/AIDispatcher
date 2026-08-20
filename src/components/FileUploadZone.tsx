import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, FileText, Image as ImageIcon, File, AlertCircle } from "lucide-react";

export interface UploadedFile {
  id: string;
  file: File;
  mimeType: string;
  sizeBytes: number;
  previewUrl: string | null;
  textPreview: string | null;
  base64: string | null;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const TEXT_PREVIEW_MIME_TYPES = new Set(["text/plain", "text/csv", "text/markdown", "application/json"]);

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).slice(0, 500));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.substring(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function FileUploadZone({
  files,
  onFilesChange,
}: {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      setError(null);
      const accepted: UploadedFile[] = [];
      for (const file of Array.from(fileList)) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setError(`${file.name} exceeds 20MB maximum limit — skipped.`);
          continue;
        }
        const mimeType = file.type || "application/octet-stream";
        const previewUrl = mimeType.startsWith("image/") ? URL.createObjectURL(file) : null;
        const textPreview = TEXT_PREVIEW_MIME_TYPES.has(mimeType) ? await readAsText(file).catch(() => null) : null;

        accepted.push({
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          file,
          mimeType,
          sizeBytes: file.size,
          previewUrl,
          textPreview,
          base64: null,
        });
      }
      onFilesChange([...files, ...accepted]);
    },
    [files, onFilesChange]
  );

  function removeFile(id: string) {
    const target = files.find((f) => f.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onFilesChange(files.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          dragging
            ? "border-orange-400 bg-orange-500/10 shadow-lg shadow-orange-500/10"
            : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/80"
        }`}
      >
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-200">
            Drag and drop documents, spreadsheets, or images here
          </p>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
            Supported: PDF, CSV, TXT, JSON, PNG, JPEG (Up to 20MB per file)
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {files.map((f) => (
            <div
              key={f.id}
              className="relative border border-slate-800 rounded-xl bg-slate-950/90 p-3 shadow-md group"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(f.id);
                }}
                className="absolute top-2 right-2 text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {f.previewUrl ? (
                <img
                  src={f.previewUrl}
                  alt={f.file.name}
                  className="w-full h-24 object-cover rounded-lg mb-2 border border-slate-800"
                />
              ) : (
                <div className="w-full h-16 flex items-center justify-center bg-slate-900/80 rounded-lg mb-2 border border-slate-800/80 text-orange-400">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="pr-5">
                <p className="text-xs font-mono font-semibold text-slate-200 truncate">{f.file.name}</p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                  <span className="uppercase">{f.mimeType.split("/")[1] || "FILE"}</span>
                  <span>•</span>
                  <span>{(f.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              {f.textPreview && (
                <p className="text-[10px] text-slate-400 mt-2 p-1.5 rounded bg-slate-900/90 border border-slate-800/80 line-clamp-2 font-mono">
                  {f.textPreview}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
