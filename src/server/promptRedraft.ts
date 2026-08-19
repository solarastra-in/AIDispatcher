import { getPlatformAssistantConfig, type ProviderCaller } from "./platformAssistant";

const REDRAFT_SYSTEM_INSTRUCTION = `You improve prompts for AI systems without changing their intent.
Rewrite the user's prompt to be clearer and more specific, preserving
everything they actually asked for. Do not add requirements they didn't
state. Do not answer the prompt — only rewrite it. Return ONLY the
rewritten prompt, no preamble, no explanation, no quotation marks.`;

export interface RedraftBenefit {
  originalEstTokens: number;
  redraftedEstTokens: number;
  tokenDelta: number;
  percentChange: number;
}

export interface RedraftResult {
  original: string;
  redrafted: string;
  provider: string;
  model: string;
  latencyMs: number;
  benefit: RedraftBenefit;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.35);
}

export async function redraftPrompt(
  originalPrompt: string,
  callProvider: ProviderCaller,
  companyId?: string | null
): Promise<RedraftResult> {
  if (!originalPrompt || !originalPrompt.trim()) {
    throw new Error("Cannot redraft an empty prompt.");
  }

  const config = getPlatformAssistantConfig(companyId);
  const compositePrompt = `${REDRAFT_SYSTEM_INSTRUCTION}\n\nORIGINAL PROMPT:\n${originalPrompt}`;

  const result = await callProvider(config.provider, config.modelId, compositePrompt);

  let redrafted = result.text.trim();
  if (
    (redrafted.startsWith('"') && redrafted.endsWith('"')) ||
    (redrafted.startsWith("'") && redrafted.endsWith("'"))
  ) {
    redrafted = redrafted.slice(1, -1).trim();
  }

  if (!redrafted) {
    throw new Error("Platform assistant returned an empty redraft — showing your original prompt unchanged.");
  }

  const originalEstTokens = estimateTokens(originalPrompt);
  const redraftedEstTokens = estimateTokens(redrafted);
  const tokenDelta = redraftedEstTokens - originalEstTokens;
  const percentChange = originalEstTokens > 0 ? Math.round((tokenDelta / originalEstTokens) * 1000) / 10 : 0;

  return {
    original: originalPrompt,
    redrafted,
    provider: config.provider,
    model: config.modelId,
    latencyMs: result.latencyMs,
    benefit: { originalEstTokens, redraftedEstTokens, tokenDelta, percentChange },
  };
}
