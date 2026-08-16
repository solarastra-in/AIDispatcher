/**
 * src/server/platformAssistant.ts
 *
 * Both the prompt-redraft feature and the context-compressor need "an AI
 * to call for a small utility task" — rewriting a prompt, summarizing
 * older turns. Rather than hardcoding a model choice, this is an
 * Admin-configured setting: Platform Admin picks which provider/model
 * handles these utility calls (likely the cheapest capable model in the
 * catalog, since redraft/compression are exactly the low-complexity,
 * high-volume task type the whole routing system is built to route
 * cheaply — see core/task_taxonomy.py's `lookup_extract` /
 * `format_transform` archetypes from the routing engine).
 *
 * This module holds ONLY the config + the real call-out. It reuses
 * whatever real provider-calling function the host app already has
 * (callDirectProviderAPI in server.ts, or callViaLocalProxy for a
 * provider connected via local proxy) — it does not duplicate provider
 * HTTP logic.
 */

export interface PlatformAssistantConfig {
  provider: string;       // must be a key in PROVIDER_CAPABILITIES / catalogModels
  modelId: string;
  useLocalProxyIfAvailable: boolean; // prefer the admin's own $0 local proxy for utility calls, if connected
  maxUtilityTokens: number;          // hard cap on redraft/compression output length
  updatedByAdminId: string;
  updatedAt: string;
}

// In-memory default — mirrors the pattern already in server.ts
// (companyProfile, etc.). Swap for a real settings table once Firestore is wired in.
let platformAssistantConfig: PlatformAssistantConfig = {
  provider: "google",
  modelId: "gemini-3.7-flash", // primary fast model as a sensible default; admin can change
  useLocalProxyIfAvailable: false,
  maxUtilityTokens: 400,
  updatedByAdminId: "system_default",
  updatedAt: new Date().toISOString(),
};

export function getPlatformAssistantConfig(): PlatformAssistantConfig {
  return platformAssistantConfig;
}

export function setPlatformAssistantConfig(
  update: Partial<Pick<PlatformAssistantConfig, "provider" | "modelId" | "useLocalProxyIfAvailable" | "maxUtilityTokens">>,
  adminId: string
): PlatformAssistantConfig {
  platformAssistantConfig = {
    ...platformAssistantConfig,
    ...update,
    updatedByAdminId: adminId,
    updatedAt: new Date().toISOString(),
  };
  return platformAssistantConfig;
}

/**
 * Type for the real call-out function this module expects to be handed —
 * matches callDirectProviderAPI's existing signature in server.ts, so no
 * new HTTP-calling code is introduced here.
 */
export type ProviderCaller = (
  provider: string,
  modelId: string,
  prompt: string
) => Promise<{ text: string; inputTokens: number; outputTokens: number; latencyMs: number }>;
