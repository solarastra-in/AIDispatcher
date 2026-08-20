export interface PlatformAssistantConfig {
  provider: string;
  modelId: string;
  useLocalProxyIfAvailable: boolean;
  maxUtilityTokens: number;
  updatedByAdminId: string;
  updatedAt: string;
}

let portalDefaultConfig: PlatformAssistantConfig = {
  provider: "google",
  modelId: "gemini-3.1-flash-lite",
  useLocalProxyIfAvailable: false,
  maxUtilityTokens: 400,
  updatedByAdminId: "system_default",
  updatedAt: new Date().toISOString(),
};

const companyOverrides: Record<string, PlatformAssistantConfig> = {};

export function getPlatformAssistantConfig(companyId?: string | null): PlatformAssistantConfig {
  if (companyId && companyOverrides[companyId]) return companyOverrides[companyId];
  return portalDefaultConfig;
}

export function setPortalDefaultAssistantConfig(
  update: Partial<Pick<PlatformAssistantConfig, "provider" | "modelId" | "useLocalProxyIfAvailable" | "maxUtilityTokens">>,
  adminId: string
): PlatformAssistantConfig {
  portalDefaultConfig = { ...portalDefaultConfig, ...update, updatedByAdminId: adminId, updatedAt: new Date().toISOString() };
  return portalDefaultConfig;
}

export function setCompanyAssistantOverride(
  companyId: string,
  update: Partial<Pick<PlatformAssistantConfig, "provider" | "modelId" | "useLocalProxyIfAvailable" | "maxUtilityTokens">>,
  adminId: string
): PlatformAssistantConfig {
  const existing = companyOverrides[companyId] || portalDefaultConfig;
  const updated: PlatformAssistantConfig = { ...existing, ...update, updatedByAdminId: adminId, updatedAt: new Date().toISOString() };
  companyOverrides[companyId] = updated;
  return updated;
}

export function clearCompanyAssistantOverride(companyId: string): void {
  delete companyOverrides[companyId];
}

export type ProviderCaller = (
  provider: string,
  modelId: string,
  prompt: string
) => Promise<{ text: string; inputTokens: number; outputTokens: number; latencyMs: number }>;
