import { useEffect, useState } from "react";
import { authedFetch } from "../lib/firebaseClient";

interface ExcludedModel {
  modelId: string;
  modelName: string;
  reason: "file_type_unsupported" | "admin_enforced" | "no_credentials_configured";
  detail: string;
}
interface CatalogModelLike {
  id: string;
  name: string;
  provider: string;
}
interface AvailabilityResponse {
  available: CatalogModelLike[];
  excluded: ExcludedModel[];
  canSelectModel: boolean;
}

const REASON_LABEL: Record<ExcludedModel["reason"], string> = {
  file_type_unsupported: "File type not supported",
  admin_enforced: "Restricted by team admin",
  no_credentials_configured: "No credentials configured",
};

export default function ModelAvailabilityPanel({
  uploadedFileMimeTypes,
  selectedModelId,
  onSelect,
}: {
  uploadedFileMimeTypes: string[];
  selectedModelId: string | null;
  onSelect: (modelId: string | null) => void;
}) {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);

  useEffect(() => {
    authedFetch("/api/models/availability", {
      method: "POST",
      body: JSON.stringify({ uploadedFileMimeTypes }),
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [uploadedFileMimeTypes.join(",")]);

  if (!data) return <div className="text-xs text-[#93999F]">Checking model availability…</div>;

  if (!data.canSelectModel) {
    return (
      <p className="text-xs text-[#93999F]">
        Your request will be automatically routed to the best available model.
        {data.excluded?.length > 0 && ` (${data.excluded.length} model(s) excluded for this request — ask your admin for details.)`}
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <button
          onClick={() => onSelect(null)}
          className={`text-xs px-3 py-1.5 rounded cursor-pointer ${selectedModelId === null ? "bg-[#FF8A3D] text-[#171208]" : "bg-[#1D222A] text-[#93999F]"}`}
        >
          Auto-route (recommended)
        </button>
        {data.available?.map((m) => {
          const qualifiedId = `${m.provider}:${m.id}`;
          const isSelected = selectedModelId === qualifiedId || selectedModelId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(qualifiedId)}
              className={`text-xs px-3 py-1.5 rounded font-mono cursor-pointer ${isSelected ? "bg-[#FF8A3D] text-[#171208]" : "bg-[#1D222A] text-[#93999F]"}`}
            >
              {m.name}
            </button>
          );
        })}
      </div>

      {data.excluded?.length > 0 && (
        <div>
          <button onClick={() => setShowExcluded((s) => !s)} className="text-[11px] text-[#5B6169] hover:text-[#93999F] cursor-pointer">
            {showExcluded ? "Hide" : "Show"} {data.excluded.length} excluded model(s)
          </button>
          {showExcluded && (
            <ul className="mt-2 space-y-1">
              {data.excluded.map((e) => (
                <li key={e.modelId} className="text-[11px] text-[#5B6169] font-mono">
                  <span className="text-[#93999F]">{e.modelName}</span> — {REASON_LABEL[e.reason]}
                  <span className="block text-[10px] text-[#5B6169] font-sans mt-0.5">{e.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
