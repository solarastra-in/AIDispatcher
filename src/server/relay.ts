export interface RelayModelStep {
  provider: string;
  modelId: string;
}

export interface RelayRound {
  roundNumber: number;
  provider: string;
  modelId: string;
  output: string;
  costUsd: number;
  changeFromPreviousPercent: number | null;
}

export interface RelayResult {
  rounds: RelayRound[];
  finalOutput: string;
  totalCostUsd: number;
  totalRounds: number;
  diminishingReturnsDetected: boolean;
}

const PLATEAU_THRESHOLD_PERCENT = 8;

function tokenizeWords(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
}

export function measureChangeMagnitude(previous: string, current: string): number {
  const prevWords = new Set(tokenizeWords(previous));
  const currWords = new Set(tokenizeWords(current));
  if (prevWords.size === 0 && currWords.size === 0) return 0;
  const intersection = [...prevWords].filter((w) => currWords.has(w)).length;
  const union = new Set([...prevWords, ...currWords]).size;
  const similarity = union === 0 ? 1 : intersection / union;
  return Math.round((1 - similarity) * 1000) / 10;
}

type ProviderCaller = (provider: string, modelId: string, prompt: string) => Promise<{
  text: string; inputTokens: number; outputTokens: number; costUsd: number;
}>;

function buildInitialPrompt(data: string, instruction: string): string {
  return `${instruction}\n\nDATA:\n${data}`;
}

function buildRefinementPrompt(previousOutput: string, instruction: string, roundNumber: number): string {
  return (
    `You are refining a previous draft. The original goal was: "${instruction}"\n\n` +
    `Improve the draft below — clarity, structure, and how appealing/polished it reads — without changing ` +
    `the underlying facts or adding information that wasn't in the original data. This is refinement round ` +
    `${roundNumber}. Return ONLY the improved version, no preamble, no explanation of what you changed.\n\n` +
    `DRAFT TO IMPROVE:\n${previousOutput}`
  );
}

export async function runRelay(
  data: string,
  instruction: string,
  modelChain: RelayModelStep[],
  callProvider: ProviderCaller
): Promise<RelayResult> {
  if (modelChain.length === 0) throw new Error("modelChain must have at least one model.");

  const rounds: RelayRound[] = [];
  let previousOutput: string | null = null;

  for (let i = 0; i < modelChain.length; i++) {
    const step = modelChain[i];
    const roundNumber = i + 1;
    const prompt = previousOutput === null
      ? buildInitialPrompt(data, instruction)
      : buildRefinementPrompt(previousOutput, instruction, roundNumber);

    const result = await callProvider(step.provider, step.modelId, prompt);
    const changeFromPreviousPercent = previousOutput === null ? null : measureChangeMagnitude(previousOutput, result.text);

    rounds.push({
      roundNumber, provider: step.provider, modelId: step.modelId,
      output: result.text, costUsd: result.costUsd, changeFromPreviousPercent,
    });

    previousOutput = result.text;
  }

  const totalCostUsd = Math.round(rounds.reduce((s, r) => s + r.costUsd, 0) * 100000) / 100000;
  const lastRound = rounds[rounds.length - 1];
  const diminishingReturnsDetected = rounds.length > 1 && lastRound.changeFromPreviousPercent !== null && lastRound.changeFromPreviousPercent < PLATEAU_THRESHOLD_PERCENT;

  return {
    rounds, finalOutput: rounds[rounds.length - 1].output, totalCostUsd,
    totalRounds: rounds.length, diminishingReturnsDetected,
  };
}
