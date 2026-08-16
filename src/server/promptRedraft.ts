/**
 * src/server/promptRedraft.ts
 *
 * "Redraft this prompt" — opt-in only, never automatic. The user writes a
 * rough prompt, clicks "Redraft with AI," reviews the suggested rewrite,
 * and can accept, edit, or discard it before anything is dispatched. This
 * module never sends the redrafted version anywhere on its own — it
 * returns a suggestion string and stops.
 */

import { getPlatformAssistantConfig, type ProviderCaller } from "./platformAssistant";

const REDRAFT_SYSTEM_INSTRUCTION = `You improve prompts for AI systems without changing their intent.
Rewrite the user's prompt to be clearer and more specific, preserving
everything they actually asked for. Do not add requirements they didn't
state. Do not answer the prompt — only rewrite it. Return ONLY the
rewritten prompt, no preamble, no explanation, no quotation marks.`;

export interface RedraftResult {
  original: string;
  redrafted: string;
  provider: string;
  model: string;
  latencyMs: number;
}

export async function redraftPrompt(
  originalPrompt: string,
  callProvider: ProviderCaller
): Promise<RedraftResult> {
  if (!originalPrompt || !originalPrompt.trim()) {
    throw new Error("Cannot redraft an empty prompt.");
  }

  const config = getPlatformAssistantConfig();
  const compositePrompt = `${REDRAFT_SYSTEM_INSTRUCTION}\n\nORIGINAL PROMPT:\n${originalPrompt}`;

  const result = await callProvider(config.provider, config.modelId, compositePrompt);

  // Defensive trim: strip wrapping quotes/preamble a model sometimes adds
  // despite instructions, without silently fabricating a "cleaner" result
  // if the model just didn't follow instructions well.
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

  return {
    original: originalPrompt,
    redrafted,
    provider: config.provider,
    model: config.modelId,
    latencyMs: result.latencyMs,
  };
}
