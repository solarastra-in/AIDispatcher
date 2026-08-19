import type { Team } from "./orgModel";

export interface CatalogModelLike {
  id: string;
  provider: string;
  name: string;
  capabilities?: {
    code?: boolean;
    vision?: boolean;
    reasoning?: boolean;
    functionCalling?: boolean;
    jsonOutput?: boolean;
    longContext?: boolean;
    pdf?: boolean;
  };
}

export type ExclusionReason = "file_type_unsupported" | "admin_enforced" | "no_credentials_configured";

export interface ExcludedModel {
  modelId: string;
  modelName: string;
  reason: ExclusionReason;
  detail: string;
}

export interface ModelAvailabilityResult {
  available: CatalogModelLike[];
  excluded: ExcludedModel[];
}

const FILE_TYPE_CAPABILITY_REQUIREMENTS: Record<string, keyof NonNullable<CatalogModelLike["capabilities"]>> = {
  "image/png": "vision",
  "image/jpeg": "vision",
  "image/webp": "vision",
  "image/gif": "vision",
  "application/pdf": "pdf",
};

export function requiredCapabilityForFile(mimeType: string): string | null {
  return FILE_TYPE_CAPABILITY_REQUIREMENTS[mimeType] ?? null;
}

export function computeModelAvailability(params: {
  catalog: CatalogModelLike[];
  uploadedFileMimeTypes: string[];
  team: Team | null;
  hasConfiguredCredential: (provider: string) => boolean;
}): ModelAvailabilityResult {
  const { catalog, uploadedFileMimeTypes, team, hasConfiguredCredential } = params;

  const requiredCaps = uploadedFileMimeTypes
    .map(requiredCapabilityForFile)
    .filter((c): c is string => c !== null);

  const available: CatalogModelLike[] = [];
  const excluded: ExcludedModel[] = [];

  for (const model of catalog) {
    if (!hasConfiguredCredential(model.provider)) {
      excluded.push({
        modelId: model.id,
        modelName: model.name,
        reason: "no_credentials_configured",
        detail: `No working API key or local proxy is configured for '${model.provider}'. Connect it in Company Credentials to make ${model.name} available.`,
      });
      continue;
    }

    if (team?.allowedModelIds && !team.allowedModelIds.includes(model.id)) {
      excluded.push({
        modelId: model.id,
        modelName: model.name,
        reason: "admin_enforced",
        detail: `Your team admin has restricted this workspace to a specific model list, and ${model.name} isn't on it.`,
      });
      continue;
    }

    const missingCap = requiredCaps.find((cap) => !model.capabilities?.[cap as keyof NonNullable<CatalogModelLike["capabilities"]>]);
    if (missingCap) {
      excluded.push({
        modelId: model.id,
        modelName: model.name,
        reason: "file_type_unsupported",
        detail: `${model.name} doesn't support '${missingCap}' input, which one of your uploaded files requires.`,
      });
      continue;
    }

    available.push(model);
  }

  return { available, excluded };
}
