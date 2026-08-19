import { useCallback, useRef, useState } from "react";

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

  const handleFiles = useCallback(async (fileList: FileList) => {
    setError(null);
    const accepted: UploadedFile[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`${file.name} is over the 20MB limit — skipped.`);
        continue;
      }
      const mimeType = file.type || "application/octet-stream";
      const previewUrl = mimeType.startsWith("image/") ? URL.createObjectURL(file) : null;
      const textPreview = TEXT_PREVIEW_MIME_TYPES.has(mimeType) ? await readAsText(file).catch(() => null) : null;

      accepted.push({
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file, mimeType, sizeBytes: file.size, previewUrl, textPreview, base64: null,
      });
    }
    onFilesChange([...files, ...accepted]);
  }, [files, onFilesChange]);

  function removeFile(id: string) {
    const target = files.find((f) => f.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onFilesChange(files.filter((f) => f.id !== id));
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border border-dashed rounded p-4 text-center cursor-pointer transition-colors ${
          dragging ? "border-[#FF8A3D] bg-[#FF8A3D]/5" : "border-[#2A2F38] hover:border-[#93999F]"
        }`}
      >
        <p className="text-xs text-[#93999F]">Drop files here, or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          {files.map((f) => (
            <div key={f.id} className="relative border border-[#2A2F38] rounded bg-[#1D222A] p-2.5">
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                className="absolute top-1.5 right-1.5 text-[#5B6169] hover:text-red-400 text-xs cursor-pointer"
              >
                ×
              </button>
              {f.previewUrl ? (
                <img src={f.previewUrl} alt={f.file.name} className="w-full h-20 object-cover rounded mb-1.5" />
              ) : (
                <div className="w-full h-20 flex items-center justify-center bg-[#171B21] rounded mb-1.5">
                  <span className="font-mono text-[10px] text-[#5B6169] uppercase">
                    {f.mimeType.split("/")[1]?.slice(0, 4) || "file"}
                  </span>
                </div>
              )}
              <p className="text-[10px] text-[#93999F] truncate">{f.file.name}</p>
              <p className="text-[9px] text-[#5B6169]">{(f.sizeBytes / 1024).toFixed(0)} KB</p>
              {f.textPreview && (
                <p className="text-[9px] text-[#5B6169] mt-1 line-clamp-3 font-mono">{f.textPreview}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
