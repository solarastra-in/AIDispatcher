import { extractFacts, compareFacts, type CorroborationResult } from "./corroboration";

export interface CorroborationRequest {
  prompt: string;
  modelA: { provider: string; modelId: string };
  modelB: { provider: string; modelId: string };
}

export interface CorroborationResponse {
  responseA: { provider: string; modelId: string; text: string; costUsd: number };
  responseB: { provider: string; modelId: string; text: string; costUsd: number };
  comparison: CorroborationResult;
  totalCostUsd: number;
  recommendation: string;
}

type ProviderCaller = (provider: string, modelId: string, prompt: string) => Promise<{
  text: string; inputTokens: number; outputTokens: number; costUsd: number;
}>;

export function assessPairDiversity(modelA: { provider: string }, modelB: { provider: string }): { diverse: boolean; note: string } {
  if (modelA.provider === modelB.provider) {
    return {
      diverse: false,
      note: `Both models are from ${modelA.provider} — agreement between them is a weaker signal than a cross-provider pair, since shared training data and systematic errors are more likely to produce correlated (not independent) mistakes.`,
    };
  }
  return { diverse: true, note: "Cross-provider pair — a stronger independence assumption than same-provider models." };
}

export async function runCorroboration(
  request: CorroborationRequest,
  callProvider: ProviderCaller
): Promise<CorroborationResponse> {
  const diversity = assessPairDiversity(request.modelA, request.modelB);

  const [resultA, resultB] = await Promise.all([
    callProvider(request.modelA.provider, request.modelA.modelId, request.prompt),
    callProvider(request.modelB.provider, request.modelB.modelId, request.prompt),
  ]);

  const comparison = compareFacts(extractFacts(resultA.text), extractFacts(resultB.text));
  const totalCostUsd = Math.round((resultA.costUsd + resultB.costUsd) * 100000) / 100000;

  let recommendation: string;
  if (comparison.comparableFactCount === 0) {
    recommendation = "No directly comparable factual claims were found in either response — this pair check doesn't add confidence here (works best for fact-dense answers: numbers, dates, named entities).";
  } else if (comparison.highImpactContradictionCount > 0) {
    recommendation = `${comparison.highImpactContradictionCount} high-impact contradiction(s) found — at least one model is very likely wrong on a specific fact. Verify those specific claims before relying on this response.`;
  } else if (comparison.agreementScore !== null && comparison.agreementScore >= 90) {
    recommendation = `Strong cross-model agreement (${comparison.agreementScore}%) on comparable facts — a meaningful confidence signal, though not a guarantee.`;
  } else {
    recommendation = `Partial agreement (${comparison.agreementScore}%) — review the specific differences below rather than trusting either response outright.`;
  }
  if (!diversity.diverse) recommendation += ` Note: ${diversity.note}`;

  return {
    responseA: { provider: request.modelA.provider, modelId: request.modelA.modelId, text: resultA.text, costUsd: resultA.costUsd },
    responseB: { provider: request.modelB.provider, modelId: request.modelB.modelId, text: resultB.text, costUsd: resultB.costUsd },
    comparison, totalCostUsd, recommendation,
  };
}
