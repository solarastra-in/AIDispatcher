import { TaskArchetypeId, TASK_ARCHETYPES } from './taskTaxonomy';
import { AIModel, ModelTier } from '../types';

export interface BetaDistribution {
  alpha: number; // successes + prior pseudo-successes
  beta: number;  // failures + prior pseudo-failures
  nObservations: number; // real observations (alpha + beta - 2)
  mean: number;  // alpha / (alpha + beta)
  variance: number;
}

export interface ModelQualityEstimate {
  modelId: string;
  providerId: string;
  expectedQuality: number; // Weighted by task archetype probability distribution
  sampledQuality: number;  // Single Thompson Sample draw from Beta distribution
  confidence: number;      // 0 to 1 based on observation depth
  nObservations: number;
  posteriorAlpha: number;
  posteriorBeta: number;
  distributionsPerArchetype: Record<TaskArchetypeId, BetaDistribution>;
}

// Pseudo-random Gamma distribution generator for standard Beta sampling (Marsaglia and Tsang method)
function sampleGamma(shape: number, scale = 1.0): number {
  if (shape < 1.0) {
    return sampleGamma(shape + 1.0, scale) * Math.pow(Math.random(), 1.0 / shape);
  }
  const d = shape - 1.0 / 3.0;
  const c = 1.0 / Math.sqrt(9.0 * d);
  while (true) {
    let z = 0;
    let v = 0;
    do {
      // Standard normal via Box-Muller
      const u1 = Math.random();
      const u2 = Math.random();
      z = Math.sqrt(-2.0 * Math.log(Math.max(1e-15, u1))) * Math.cos(2.0 * Math.PI * u2);
      v = 1.0 + c * z;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();
    if (u < 1.0 - 0.0331 * z * z * z * z) {
      return d * v * scale;
    }
    if (Math.log(u) < 0.5 * z * z + d * (1.0 - v + Math.log(v))) {
      return d * v * scale;
    }
  }
}

// Sample from Beta(alpha, beta) using X = Gamma(alpha) / (Gamma(alpha) + Gamma(beta))
export function sampleBeta(alpha: number, beta: number): number {
  const gA = sampleGamma(alpha);
  const gB = sampleGamma(beta);
  if (gA + gB <= 0) return 0.5;
  return gA / (gA + gB);
}

export class QualityModelTracker {
  // Key: `${archetypeId}:${providerId}:${modelId}` -> { alpha, beta }
  private store: Map<string, { alpha: number; beta: number; seedObservations: number }> = new Map();
  private listeners: Array<() => void> = [];

  constructor(models: AIModel[] = []) {
    if (models.length > 0) {
      this.seedTierPriors(models);
    }
  }

  private makeKey(archetypeId: TaskArchetypeId, providerId: string, modelId: string): string {
    return `${archetypeId}:${providerId}:${modelId}`;
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  /**
   * Seed cold-start weak priors: 5 pseudo-observations.
   * If model tier matches archetype tier_hint -> mean 0.62 (alpha=3.1, beta=1.9)
   * If model tier is below or above -> mean 0.42 (alpha=2.1, beta=2.9)
   * For frontier models on reasoning -> mean 0.82 (alpha=4.1, beta=0.9)
   */
  public seedTierPriors(models: AIModel[]) {
    const archetypes = Object.values(TASK_ARCHETYPES);

    for (const model of models) {
      for (const arch of archetypes) {
        const key = this.makeKey(arch.id, model.provider, model.id);
        if (this.store.has(key)) continue; // Don't clobber existing evidence

        let targetMean = 0.42;
        if (model.tier === arch.tierHint) {
          targetMean = 0.64;
        } else if (arch.tierHint === 'low' && (model.tier === 'low' || model.tier === 'mid')) {
          targetMean = 0.72;
        } else if (arch.tierHint === 'high' && (model.tier === 'high' || model.tier === 'frontier' || model.tier === 'deep_reasoning')) {
          targetMean = 0.78;
        } else if (arch.tierHint === 'frontier' && (model.tier === 'frontier' || model.tier === 'deep_reasoning')) {
          targetMean = 0.85;
        }

        // Benchmark score adjustments
        const benchmarkBonus = (model.qualityBenchmarkScore - 80) / 100 * 0.15;
        targetMean = Math.max(0.2, Math.min(0.95, targetMean + benchmarkBonus));

        const pseudoCount = 5.0; // weak prior: 5 pseudo-observations
        const alpha = 1.0 + (targetMean * pseudoCount);
        const beta = 1.0 + ((1.0 - targetMean) * pseudoCount);

        this.store.set(key, { alpha, beta, seedObservations: 0 });
      }
    }
    this.notify();
  }

  public getBeta(archetypeId: TaskArchetypeId, providerId: string, modelId: string): BetaDistribution {
    const key = this.makeKey(archetypeId, providerId, modelId);
    const val = this.store.get(key) || { alpha: 2.0, beta: 2.0, seedObservations: 0 };
    const alpha = val.alpha;
    const beta = val.beta;
    const nObs = Math.max(0, Math.round(alpha + beta - 2));
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / ((alpha + beta) * (alpha + beta) * (alpha + beta + 1));

    return {
      alpha: Number(alpha.toFixed(3)),
      beta: Number(beta.toFixed(3)),
      nObservations: nObs,
      mean: Number(mean.toFixed(4)),
      variance: Number(variance.toFixed(6))
    };
  }

  /**
   * Record success or failure outcome to update posterior directly
   */
  public recordOutcome(
    archetypeId: TaskArchetypeId,
    providerId: string,
    modelId: string,
    isSuccess: boolean,
    weight = 1.0
  ) {
    const key = this.makeKey(archetypeId, providerId, modelId);
    const current = this.store.get(key) || { alpha: 2.0, beta: 2.0, seedObservations: 0 };
    
    const deltaAlpha = isSuccess ? weight : 0;
    const deltaBeta = isSuccess ? 0 : weight;

    this.store.set(key, {
      alpha: current.alpha + deltaAlpha,
      beta: current.beta + deltaBeta,
      seedObservations: current.seedObservations + 1
    });

    this.notify();
  }

  /**
   * Compute expected quality and Thompson sample across the full task probability distribution
   */
  public estimateQuality(
    model: AIModel,
    taskProbabilities: Record<TaskArchetypeId, number>
  ): ModelQualityEstimate {
    let expectedQuality = 0;
    let sampledQuality = 0;
    let totalObservations = 0;
    let totalAlpha = 0;
    let totalBeta = 0;
    const distributionsPerArchetype: Record<TaskArchetypeId, BetaDistribution> = {} as any;

    const archetypes = Object.keys(taskProbabilities) as TaskArchetypeId[];

    for (const archId of archetypes) {
      const prob = taskProbabilities[archId] || 0;
      if (prob <= 0) continue;

      const betaDist = this.getBeta(archId, model.provider, model.id);
      distributionsPerArchetype[archId] = betaDist;

      // Draw single Thompson sample for this archetype
      const sample = sampleBeta(betaDist.alpha, betaDist.beta);

      expectedQuality += prob * betaDist.mean;
      sampledQuality += prob * sample;
      totalObservations += prob * betaDist.nObservations;
      totalAlpha += prob * betaDist.alpha;
      totalBeta += prob * betaDist.beta;
    }

    // Confidence scales with number of real observations
    const confidence = 1.0 - (1.0 / Math.sqrt(Math.max(1, totalObservations) + 1));

    return {
      modelId: model.id,
      providerId: model.provider,
      expectedQuality: Number(expectedQuality.toFixed(4)),
      sampledQuality: Number(sampledQuality.toFixed(4)),
      confidence: Number(confidence.toFixed(3)),
      nObservations: Math.round(totalObservations),
      posteriorAlpha: Number(totalAlpha.toFixed(2)),
      posteriorBeta: Number(totalBeta.toFixed(2)),
      distributionsPerArchetype,
    };
  }

  public getAllEntries(): Array<{
    key: string;
    archetypeId: TaskArchetypeId;
    providerId: string;
    modelId: string;
    alpha: number;
    beta: number;
    mean: number;
    observations: number;
  }> {
    const list: any[] = [];
    this.store.forEach((val, key) => {
      const [archetypeId, providerId, modelId] = key.split(':');
      list.push({
        key,
        archetypeId: archetypeId as TaskArchetypeId,
        providerId,
        modelId,
        alpha: Number(val.alpha.toFixed(2)),
        beta: Number(val.beta.toFixed(2)),
        mean: Number((val.alpha / (val.alpha + val.beta)).toFixed(4)),
        observations: Math.max(0, Math.round(val.alpha + val.beta - 2)),
      });
    });
    return list;
  }
}
