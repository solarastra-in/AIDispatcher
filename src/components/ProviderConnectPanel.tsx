/**
 * src/components/ProviderConnectPanel.tsx
 *
 * Renders a "Connect [Provider]" card per provider, driven entirely by
 * GET /api/providers/connect-flows — no hardcoded per-provider UI logic,
 * so a new provider added to PROVIDER_CAPABILITIES shows up here
 * automatically. Two paths per card:
 *   - API key providers: a masked input + Save.
 *   - Local-proxy-capable providers (Anthropic, OpenAI): numbered setup
 *     steps pointing at the downloadable wrapper script, plus a URL input
 *     that only saves after a REAL verify call succeeds — never marks
 *     "connected" optimistically.
 */
import React, { useEffect, useState } from "react";

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

  useEffect(() => {
    fetch("/api/providers/connect-flows")
      .then((r) => r.json())
      .then((data) => setFlows(data.flows || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-[#93999F]">Loading connect flows…</div>;
  if (error) return <div className="text-sm text-red-400">Failed to load: {error}</div>;

  return (
    <div className="grid gap-4">
      {flows.map((flow) => (
        <ProviderCard key={flow.provider} flow={flow} onSaved={() =>
          fetch("/api/providers/connect-flows").then((r) => r.json()).then((d) => setFlows(d.flows || []))
        } />
      ))}
    </div>
  );
}

const ProviderCard: React.FC<{ flow: ConnectFlow; onSaved: () => void | Promise<void> }> = ({ flow, onSaved }) => {
  const [mode, setMode] = useState<"api_key" | "local_proxy">(
    flow.currentStatus.hasVerifiedLocalProxy ? "local_proxy" : "api_key"
  );
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [proxyUrlInput, setProxyUrlInput] = useState(flow.currentStatus.localProxyUrl || "");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<{ latencyMs: number; models: string[] } | null>(null);

  async function saveApiKey() {
    await fetch("/api/credentials/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: flow.provider, apiKey: apiKeyInput, authMethod: "api_key" }),
    });
    setApiKeyInput("");
    onSaved();
  }

  async function verifyLocalProxy() {
    setVerifying(true);
    setVerifyError(null);
    setVerifySuccess(null);
    try {
      const res = await fetch("/api/credentials/local-proxy/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: flow.provider, localProxyUrl: proxyUrlInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.error || "Verification failed");
      } else {
        setVerifySuccess({ latencyMs: data.latencyMs, models: data.detectedModels });
        onSaved();
      }
    } catch (e: any) {
      setVerifyError(e.message);
    } finally {
      setVerifying(false);
    }
  }

  const connected = flow.currentStatus.hasApiKey || flow.currentStatus.hasVerifiedLocalProxy;

  return (
    <div className="border border-[#2A2F38] rounded bg-[#171B21] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[15px]">{flow.providerDisplayName}</h3>
        <span className={`text-xs font-mono px-2 py-1 rounded ${connected ? "text-[#4FD1C5]" : "text-[#93999F]"}`}>
          {connected ? "● connected" : "○ not connected"}
        </span>
      </div>

      {flow.localProxySupported && (
        <div className="flex gap-2 mb-4 text-xs">
          <button
            onClick={() => setMode("api_key")}
            className={`px-3 py-1.5 rounded ${mode === "api_key" ? "bg-[#FF8A3D] text-[#171208]" : "bg-[#1D222A] text-[#93999F]"}`}
          >
            API key
          </button>
          <button
            onClick={() => setMode("local_proxy")}
            className={`px-3 py-1.5 rounded ${mode === "local_proxy" ? "bg-[#FF8A3D] text-[#171208]" : "bg-[#1D222A] text-[#93999F]"}`}
          >
            Local subscription proxy ($0/token)
          </button>
        </div>
      )}

      {mode === "api_key" && (
        <div className="flex gap-2">
          <input
            type="password"
            placeholder={`${flow.providerDisplayName} API key`}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="flex-1 bg-[#1D222A] border border-[#2A2F38] rounded px-3 py-2 text-sm font-mono"
          />
          <button onClick={saveApiKey} disabled={!apiKeyInput} className="px-4 py-2 bg-[#FF8A3D] text-[#171208] rounded text-sm font-medium disabled:opacity-40">
            Save
          </button>
        </div>
      )}

      {mode === "local_proxy" && (
        <div>
          <ol className="text-xs text-[#93999F] space-y-1.5 mb-3 list-decimal list-inside">
            {flow.setupSteps.map((s) => (
              <li key={s.step}>{s.action}</li>
            ))}
          </ol>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="http://localhost:11500/v1"
              value={proxyUrlInput}
              onChange={(e) => setProxyUrlInput(e.target.value)}
              className="flex-1 bg-[#1D222A] border border-[#2A2F38] rounded px-3 py-2 text-sm font-mono"
            />
            <button
              onClick={verifyLocalProxy}
              disabled={!proxyUrlInput || verifying}
              className="px-4 py-2 bg-[#FF8A3D] text-[#171208] rounded text-sm font-medium disabled:opacity-40"
            >
              {verifying ? "Verifying…" : "Verify & connect"}
            </button>
          </div>
          {verifyError && <p className="text-xs text-red-400 mt-2">{verifyError}</p>}
          {verifySuccess && (
            <p className="text-xs text-[#4FD1C5] mt-2">
              Verified live — {verifySuccess.latencyMs}ms, {verifySuccess.models.length} model(s) detected.
            </p>
          )}
          <p className="text-[11px] text-[#5B6169] mt-3">{flow.localProxyNotes}</p>
        </div>
      )}
    </div>
  );
}
