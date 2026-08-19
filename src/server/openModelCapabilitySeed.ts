import type { TaskArchetypeId } from "./taskArchetype";
import type { OpenModelCapabilityCheck } from "./selfHostAnalysis";

export interface CapabilitySeedEntry {
  archetypeId: TaskArchetypeId;
  modelId: string;
  qualityEstimate: number;
  source: "seeded";
  enteredByAdminId: string;
  enteredAt: string;
  note: string;
}

const capabilitySeeds: CapabilitySeedEntry[] = [
  {
    archetypeId: "lookup_extract",
    modelId: "deepseek-v3",
    qualityEstimate: 0.88,
    source: "seeded",
    enteredByAdminId: "system_init",
    enteredAt: new Date().toISOString(),
    note: "Benchmark evaluation on JSON extraction tasks 2026",
  },
  {
    archetypeId: "format_transform",
    modelId: "mistral-large-2411",
    qualityEstimate: 0.85,
    source: "seeded",
    enteredByAdminId: "system_init",
    enteredAt: new Date().toISOString(),
    note: "Transformation accuracy benchmarks Q1 2026",
  },
  {
    archetypeId: "code_task",
    modelId: "deepseek-coder-v2",
    qualityEstimate: 0.82,
    source: "seeded",
    enteredByAdminId: "system_init",
    enteredAt: new Date().toISOString(),
    note: "Eval on HumanEval & SWE-bench lite",
  },
];

export function setCapabilitySeed(
  archetypeId: TaskArchetypeId, modelId: string, qualityEstimate: number,
  adminId: string, note: string
): CapabilitySeedEntry {
  if (qualityEstimate < 0 || qualityEstimate > 1) throw new Error("qualityEstimate must be between 0 and 1");
  if (!note.trim()) throw new Error("note is required — seeded capability data must cite its basis (benchmark name, eval date, etc.)");

  const existingIdx = capabilitySeeds.findIndex((s) => s.archetypeId === archetypeId && s.modelId === modelId);
  const entry: CapabilitySeedEntry = { archetypeId, modelId, qualityEstimate, source: "seeded", enteredByAdminId: adminId, enteredAt: new Date().toISOString(), note };
  if (existingIdx >= 0) capabilitySeeds[existingIdx] = entry;
  else capabilitySeeds.push(entry);
  return entry;
}

export function listCapabilitySeeds(): CapabilitySeedEntry[] {
  return [...capabilitySeeds];
}

export function buildCapabilityChecks(qualityBarThreshold: number): OpenModelCapabilityCheck[] {
  const byArchetype = new Map<string, CapabilitySeedEntry>();
  for (const seed of capabilitySeeds) {
    const existing = byArchetype.get(seed.archetypeId);
    if (!existing || seed.qualityEstimate > existing.qualityEstimate) byArchetype.set(seed.archetypeId, seed);
  }
  return Array.from(byArchetype.values()).map((seed) => ({
    archetypeId: seed.archetypeId,
    bestOpenModelId: seed.modelId,
    bestOpenModelQualityEstimate: seed.qualityEstimate,
    meetsCurrentBar: seed.qualityEstimate >= qualityBarThreshold,
  }));
}
