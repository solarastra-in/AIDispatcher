import { classifyArchetype, type TaskArchetypeId } from "./taskArchetype";
import type { ArchetypeUsage } from "./selfHostAnalysis";

export interface UsageEventRecord {
  id: string;
  companyId: string | null;
  userId: string | null;
  archetypeId: TaskArchetypeId;
  provider: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  qualityMet: boolean;
  createdAt: string;
}

const usageEvents: UsageEventRecord[] = [];

export function recordUsageEvent(input: Omit<UsageEventRecord, "id" | "archetypeId" | "createdAt"> & { prompt: string }): UsageEventRecord {
  const record: UsageEventRecord = {
    id: `usage_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    companyId: input.companyId,
    userId: input.userId,
    archetypeId: classifyArchetype(input.prompt),
    provider: input.provider,
    modelId: input.modelId,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    costUsd: input.costUsd,
    qualityMet: input.qualityMet,
    createdAt: new Date().toISOString(),
  };
  usageEvents.push(record);
  return record;
}

export function aggregateUsageByArchetype(companyId: string, periodDays: number): { usage: ArchetypeUsage[]; periodDays: number } {
  const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
  const relevant = usageEvents.filter((e) => e.companyId === companyId && new Date(e.createdAt).getTime() >= cutoff);

  const byArchetype = new Map<TaskArchetypeId, { requestCount: number; totalTokens: number; spend: number; qualityMetCount: number }>();
  for (const e of relevant) {
    const bucket = byArchetype.get(e.archetypeId) ?? { requestCount: 0, totalTokens: 0, spend: 0, qualityMetCount: 0 };
    bucket.requestCount += 1;
    bucket.totalTokens += e.inputTokens + e.outputTokens;
    bucket.spend += e.costUsd;
    if (e.qualityMet) bucket.qualityMetCount += 1;
    byArchetype.set(e.archetypeId, bucket);
  }

  const usage: ArchetypeUsage[] = Array.from(byArchetype.entries()).map(([archetypeId, b]) => ({
    archetypeId,
    requestCount: b.requestCount,
    totalTokens: b.totalTokens,
    currentSpendUsd: Math.round(b.spend * 100) / 100,
    currentAvgQualityMet: b.requestCount > 0 && b.qualityMetCount / b.requestCount >= 0.8,
  }));

  return { usage, periodDays };
}
