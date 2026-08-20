import React, { useEffect, useState } from "react";
import { authedFetch } from "../lib/firebaseClient";
import { 
  KeyRound, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Lock, 
  Sparkles, 
  Zap 
} from "lucide-react";

interface ConnectFlow {
  provider: string;
  providerDisplayName: string;
  apiKeySupported: boolean;
  localProxySupported: boolean;
  localProxyNotes: string;
  currentStatus: {
    hasApiKey: boolean;
    hasVerifiedLocalProxy: boolean;
    localProxyUrl?: string;
    lastVerifiedAt?: string;
    detectedModels: string[];
  };
  setupSteps: { step: number; action: string }[];
}

export default function ProviderConnectPanel() {
  const [flows, setFlows] = useState<ConnectFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadFlows() {
    authedFetch("/api/providers/connect-flows")
      .then((r) => r.json())
      .then((data) => setFlows(data.flows || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadFlows();
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-slate-900/60 border border-white/10 rounded-2xl text-xs text-slate-400 font-mono flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
        <span>Loading provider connection gateways…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span>Failed to load connection gateways: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flows.map((flow) => (
          <ProviderCard
            key={flow.provider}
            flow={flow}
            onSaved={loadFlows}
          />
        ))}
      </div>
    </div>
  );
}

const ProviderCard: React.FC<{ flow: ConnectFlow; onSaved: () => void }> = ({ flow, onSaved }) => {
  const [mode, setMode] = useState<"api_key" | "local_proxy">(
    flow.currentStatus.hasVerifiedLocalProxy ? "local_proxy" : "api_key"
  );
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [proxyUrlInput, setProxyUrlInput] = useState(flow.currentStatus.localProxyUrl || "");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<{ latencyMs: number; models: string[] } | null>(null);
  const [savingKey, setSavingKey] = useState(false);
  const [saveKeySuccess, setSaveKeySuccess] = useState(false);

  async function saveApiKey() {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    setVerifyError(null);
    try {
      const res = await authedFetch("/api/credentials/save", {
        method: "POST",
        body: JSON.stringify({ provider: flow.provider, apiKey: apiKeyInput, authMethod: "api_key" }),
      });
      if (!res.ok) throw new Error("Failed to save credentials");
      setApiKeyInput("");
      setSaveKeySuccess(true);
      setTimeout(() => setSaveKeySuccess(false), 3000);
      onSaved();
    } catch (e: any) {
      setVerifyError(e.message || "Failed to save API key.");
    } finally {
      setSavingKey(false);
    }
  }

  async function testLocalProxy() {
    if (!proxyUrlInput.trim()) return;
    setVerifying(true);
    setVerifyError(null);
    setVerifySuccess(null);
    try {
      const res = await authedFetch("/api/credentials/verify-proxy", {
        method: "POST",
        body: JSON.stringify({ provider: flow.provider, localProxyUrl: proxyUrlInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setVerifyError(data.error || "Proxy verification failed. Check that your local endpoint is accessible.");
      } else {
        setVerifySuccess({ latencyMs: data.latencyMs, models: data.detectedModels || [] });
        onSaved();
      }
    } catch (e: any) {
      setVerifyError(e.message || "Network error while connecting to proxy.");
    } finally {
      setVerifying(false);
    }
  }

  const isConnected = flow.currentStatus.hasApiKey || flow.currentStatus.hasVerifiedLocalProxy;

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold font-mono text-xs">
              {flow.provider.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">{flow.providerDisplayName}</h4>
              <span className="text-[10px] font-mono text-slate-500">{flow.provider} gateway</span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${
              isConnected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-slate-800/80 text-slate-400 border-slate-700"
            }`}
          >
            {isConnected ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isConnected ? "Connected" : "Unconfigured"}
          </span>
        </div>

        {/* Tab switcher: API Key vs Local Proxy */}
        <div className="flex items-center gap-2 mt-4 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode("api_key")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === "api_key"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <KeyRound className="w-3 h-3" />
            <span>Direct API Key</span>
          </button>
          <button
            onClick={() => setMode("local_proxy")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === "local_proxy"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Server className="w-3 h-3" />
            <span>Local Proxy / BYOS</span>
          </button>
        </div>

        <div className="mt-4">
          {mode === "api_key" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  API Key Secret:
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={flow.currentStatus.hasApiKey ? "•••••••••••••••• (Key saved)" : "Enter API Key..."}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 font-mono"
                />
              </div>

              <button
                onClick={saveApiKey}
                disabled={!apiKeyInput.trim() || savingKey}
                className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {savingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Save API Key</span>
              </button>

              {saveKeySuccess && (
                <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> API key saved securely!
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Local Proxy Base URL:
                </label>
                <input
                  type="text"
                  value={proxyUrlInput}
                  onChange={(e) => setProxyUrlInput(e.target.value)}
                  placeholder="http://localhost:8080/v1"
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 font-mono"
                />
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                {flow.localProxyNotes}
              </p>

              <button
                onClick={testLocalProxy}
                disabled={!proxyUrlInput.trim() || verifying}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" /> : <Zap className="w-3.5 h-3.5 text-orange-400" />}
                <span>Verify Endpoint Connection</span>
              </button>

              {verifySuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected! ({verifySuccess.latencyMs}ms)
                  </div>
                  {verifySuccess.models.length > 0 && (
                    <div className="text-[10px] text-slate-400">
                      Discovered: {verifySuccess.models.slice(0, 3).join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {verifyError && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
          <span>{verifyError}</span>
        </div>
      )}
    </div>
  );
};
