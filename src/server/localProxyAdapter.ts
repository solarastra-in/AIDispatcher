export type AuthMethod = "api_key" | "local_proxy" | "both";

export interface ProviderCapability {
  provider: string;
  providerDisplayName: string;
  apiKeySupported: boolean;
  localProxySupported: boolean;
  localProxyNotes: string;
}

export const PROVIDER_CAPABILITIES: Record<string, ProviderCapability> = {
  anthropic: {
    provider: "anthropic",
    providerDisplayName: "Anthropic Claude",
    apiKeySupported: true,
    localProxySupported: true,
    localProxyNotes:
      "User must run their own local OpenAI-compatible wrapper around the " +
      "`claude` CLI (e.g. a `claude -p` proxy) authenticated on their own " +
      "machine under their own Claude Pro/Max login. WhyOr calls only the " +
      "local URL the user supplies and never performs Claude login itself.",
  },
  openai: {
    provider: "openai",
    providerDisplayName: "OpenAI",
    apiKeySupported: true,
    localProxySupported: true,
    localProxyNotes:
      "User authenticates the Codex CLI locally under their own ChatGPT " +
      "Plus/Pro subscription and supplies the resulting local proxy URL. " +
      "Re-verify current OpenAI terms before enabling this in production.",
  },
  google: {
    provider: "google",
    providerDisplayName: "Google Gemini",
    apiKeySupported: true,
    localProxySupported: false,
    localProxyNotes:
      "No subscription-OAuth path exists for Gemini. API key or a " +
      "user-owned, billing-enabled GCP project only.",
  },
  deepseek: {
    provider: "deepseek",
    providerDisplayName: "DeepSeek",
    apiKeySupported: true,
    localProxySupported: false,
    localProxyNotes: "API key only — no subscription/local-proxy pattern verified.",
  },
  groq: {
    provider: "groq",
    providerDisplayName: "Groq LPU",
    apiKeySupported: true,
    localProxySupported: false,
    localProxyNotes: "API key only.",
  },
  mistral: {
    provider: "mistral",
    providerDisplayName: "Mistral AI",
    apiKeySupported: true,
    localProxySupported: false,
    localProxyNotes: "API key only.",
  },
};

export interface LocalProxyCredential {
  provider: string;
  authMethod: AuthMethod;
  localProxyUrl?: string;
  localProxyLastVerifiedAt?: string;
  localProxyLatencyMs?: number;
  localProxyModelsDetected?: string[];
  scope: "individual_user_only";
}

export async function verifyLocalProxy(
  provider: string,
  localProxyUrl: string,
  timeoutMs = 3000
): Promise<{ ok: boolean; latencyMs: number; models: string[]; error?: string }> {
  const cap = PROVIDER_CAPABILITIES[provider];
  if (!cap || !cap.localProxySupported) {
    return { ok: false, latencyMs: 0, models: [], error: `local proxy not supported for provider '${provider}'` };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const res = await fetch(`${localProxyUrl.replace(/\/$/, "")}/models`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return { ok: false, latencyMs, models: [], error: `local proxy responded ${res.status}` };
    }
    const data: any = await res.json();
    const models: string[] = Array.isArray(data?.data) ? data.data.map((m: any) => m.id) : [];
    return { ok: true, latencyMs, models };
  } catch (err: any) {
    clearTimeout(timeout);
    return { ok: false, latencyMs: Date.now() - start, models: [], error: err.message || "unreachable" };
  }
}

export async function callViaLocalProxy(
  localProxyUrl: string,
  modelId: string,
  prompt: string
): Promise<{ text: string; inputTokens: number; outputTokens: number; latencyMs: number; costUsd: number }> {
  const start = Date.now();
  const res = await fetch(`${localProxyUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: modelId, messages: [{ role: "user", content: prompt }] }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Local proxy at ${localProxyUrl} returned ${res.status}: ${errText}`);
  }

  const data: any = await res.json();
  const latencyMs = Date.now() - start;
  const text = data.choices?.[0]?.message?.content || "";

  return {
    text,
    inputTokens: data.usage?.prompt_tokens ?? Math.ceil(prompt.split(/\s+/).length * 1.35),
    outputTokens: data.usage?.completion_tokens ?? Math.ceil(text.split(/\s+/).length * 1.35),
    latencyMs,
    costUsd: 0,
  };
}

export function isEligibleForLocalProxyRouting(personaType: "guest" | "user" | "team_member" | "team_admin" | "platform_admin"): boolean {
  return personaType === "user";
}
