import { useEffect, useState } from "react";
import { authedFetch } from "../lib/firebaseClient";
import { Cpu, ShieldAlert, Sparkles, ChevronDown, ChevronUp, Check, CheckSquare, Square, Zap, RefreshCw } from "lucide-react";

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
  tier?: string;
  inputPricePerM?: number;
  outputPricePerM?: number;
  qualityBenchmarkScore?: number;
}
interface AvailabilityResponse {
  available: CatalogModelLike[];
  excluded: ExcludedModel[];
  canSelectModel: boolean;
}

const REASON_LABEL: Record<ExcludedModel["reason"], string> = {
  file_type_unsupported: "File type not supported",
  admin_enforced: "Restricted by team admin",
  no_credentials_configured: "No API credentials configured",
};

const PROVIDER_COLORS: Record<string, { badge: string; text: string; border: string }> = {
  google: { badge: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
  openai: { badge: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  anthropic: { badge: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  deepseek: { badge: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" },
  groq: { badge: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  mistral: { badge: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30" },
  meta: { badge: "bg-indigo-500/15", text: "text-indigo-400", border: "border-indigo-500/30" },
};

export interface ModelAvailabilityPanelProps {
  uploadedFileMimeTypes: string[];
  selectedModelIds: string[];
  onSelect: (modelIds: string[]) => void;
}

export default function ModelAvailabilityPanel({
  uploadedFileMimeTypes,
  selectedModelIds = [],
  onSelect,
}: ModelAvailabilityPanelProps) {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    authedFetch("/api/models/availability", {
      method: "POST",
      body: JSON.stringify({ uploadedFileMimeTypes }),
    })
      .then((r) => r.json())
      .then((res) => {
        setData(res);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uploadedFileMimeTypes.join(",")]);

  if (loading && !data) {
    return (
      <div className="text-xs text-slate-500 font-mono flex items-center gap-2 py-1">
        <Cpu className="w-3.5 h-3.5 animate-pulse text-orange-400" />
        <span>Evaluating provider & model availability matrix…</span>
      </div>
    );
  }

  if (!data || !data.canSelectModel) {
    return (
      <div className="text-xs text-slate-400 font-mono bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-amber-300">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>⚡ Auto-Dispatch Policy Enforced (Platform-wide optimal quality/cost routing active)</span>
        </span>
        {data?.excluded?.length ? (
          <span className="text-slate-500 text-[11px]">{data.excluded.length} restricted models</span>
        ) : null}
      </div>
    );
  }

  const availableModels = data.available || [];
  const selectedCount = selectedModelIds.length;

  const toggleModel = (id: string, provider: string) => {
    const qualifiedId = `${provider}:${id}`;
    const isCurrentlySelected = selectedModelIds.includes(qualifiedId) || selectedModelIds.includes(id);

    if (isCurrentlySelected) {
      // Remove from selection
      const updated = selectedModelIds.filter((t) => t !== qualifiedId && t !== id);
      onSelect(updated);
    } else {
      // Add to selection
      onSelect([...selectedModelIds, qualifiedId]);
    }
  };

  const selectAll = () => {
    const all = availableModels.map((m) => `${m.provider}:${m.id}`);
    onSelect(all);
  };

  const clearSelection = () => {
    onSelect([]);
  };

  return (
    <div className="space-y-2.5">
      {/* Top Status & Controls Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-orange-400" />
            <span>Target Model Selection:</span>
          </span>

          {/* Dynamic Optimization Badge */}
          {selectedCount === 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/40 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>Auto-Route Across All ({availableModels.length}) Models</span>
            </span>
          ) : selectedCount === 1 ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 font-semibold">
              <Check className="w-3 h-3 text-cyan-400" />
              <span>Direct Single Target (1 Model)</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-semibold">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Optimizing Across {selectedCount} Selected Target Models</span>
            </span>
          )}
        </div>

        {/* Quick Selection Utilities */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={clearSelection}
            className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
              selectedCount === 0
                ? "bg-orange-500 text-slate-950 font-bold shadow-sm"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800"
            }`}
            title="Optimize across all catalog models"
          >
            Auto-Route All
          </button>
          
          <button
            type="button"
            onClick={selectAll}
            className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[11px] transition-all cursor-pointer"
            title="Select all available models"
          >
            Select All
          </button>

          {selectedCount > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 text-[11px] transition-all cursor-pointer"
              title="Clear selection to auto-route"
            >
              Reset
            </button>
          )}

          {/* Excluded Models Toggle */}
          {data.excluded?.length > 0 && (
            <button
              type="button"
              onClick={() => setShowExcluded((s) => !s)}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 ml-1 transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              <span>{showExcluded ? "Hide" : "Show"} {data.excluded.length} excluded</span>
              {showExcluded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Explanatory helper pill */}
      <div className="text-[11px] text-slate-400 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
        <span>
          {selectedCount === 0
            ? "💡 When no specific models are selected, WhyOr evaluates the full catalog and picks the cheapest effective model."
            : selectedCount === 1
            ? "🎯 Single model target locked. Prompt will be dispatched directly to this model."
            : `⚡ Multi-target pool active: WhyOr will optimize strictly within your ${selectedCount} selected models and choose the cheapest effective candidate.`}
        </span>
        <span className="text-[10px] font-mono text-slate-500">
          {selectedCount}/{availableModels.length} active
        </span>
      </div>

      {/* Interactive Model Selection Chips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {availableModels.map((m) => {
          const qualifiedId = `${m.provider}:${m.id}`;
          const isSelected = selectedModelIds.includes(qualifiedId) || selectedModelIds.includes(m.id);
          const provStyle = PROVIDER_COLORS[m.provider] || { badge: "bg-slate-800", text: "text-slate-300", border: "border-slate-700" };

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleModel(m.id, m.provider)}
              className={`p-2.5 rounded-xl text-left font-mono transition-all flex items-start justify-between gap-2 cursor-pointer border ${
                isSelected
                  ? "bg-orange-500/15 border-orange-500/50 shadow-md shadow-orange-500/10 text-orange-200"
                  : "bg-slate-950/70 border-slate-800/90 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 hover:border-slate-700"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase tracking-wider ${provStyle.badge} ${provStyle.text} border ${provStyle.border}`}>
                    {m.provider}
                  </span>
                  <span className="text-xs font-semibold text-slate-100 truncate">
                    {m.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>{m.tier || "Standard"}</span>
                  {m.inputPricePerM !== undefined && (
                    <span>• ${(m.inputPricePerM).toFixed(2)}/M in</span>
                  )}
                  {m.qualityBenchmarkScore !== undefined && (
                    <span className="text-slate-400 font-semibold">• Q:{m.qualityBenchmarkScore}</span>
                  )}
                </div>
              </div>

              {/* Checkbox indicator */}
              <div className="mt-0.5 shrink-0">
                {isSelected ? (
                  <div className="w-4 h-4 rounded bg-orange-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded border border-slate-700 bg-slate-900/80" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Excluded Models Section */}
      {showExcluded && data.excluded?.length > 0 && (
        <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2 animate-in fade-in">
          <p className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            <span>Excluded / Restricted Models For This Request:</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {data.excluded.map((e) => (
              <div key={e.modelId} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px]">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span className="truncate">{e.modelName}</span>
                  <span className="text-[10px] text-amber-400 font-mono shrink-0 ml-1">{REASON_LABEL[e.reason]}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">{e.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
