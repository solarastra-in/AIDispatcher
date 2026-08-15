import { AIModel, ModelTier } from '../types';
import { TaskArchetypeId, TASK_ARCHETYPES } from './taskTaxonomy';
import { TaskProbabilityDistribution } from './embeddingClassifier';
import { QualityModelTracker, ModelQualityEstimate } from './qualityModel';

export interface ModelCandidateDecision {
  model: AIModel;
  qualityEstimate: ModelQualityEstimate;
  estimatedCostUsd: number;
  isEligible: boolean;
  clearedQualityBar: boolean;
  disqualificationReason?: string;
  isWinner: boolean;
}

export interface ThompsonRoutingDecision {
  chosenModel: AIModel;
  baselineFrontierModel: AIModel;
  primaryArchetype: TaskArchetypeId;
  taskProbabilities: Record<TaskArchetypeId, number>;
  qualityThreshold: number;
  sampledQuality: number;
  expectedQuality: number;
  confidence: number;
  explored: boolean;
  routingReason: string;
  candidates: ModelCandidateDecision[];
}

export class ThompsonDecisionEngine {
  constructor(private qualityTracker: QualityModelTracker) {}

  public selectModel(
    models: AIModel[],
    taskDistribution: TaskProbabilityDistribution,
    allowedTiers: ModelTier[],
    qualityThreshold = 0.72,
    estimatedInputTokens = 500,
    estimatedOutputTokens = 300,
    enforceModelId?: string,
    enforceTier?: ModelTier
  ): ThompsonRoutingDecision {
    const activeModels = models.filter(m => m.status === 'active');
    const primaryArch = TASK_ARCHETYPES[taskDistribution.primaryArchetype];
    const reqCapabilities = primaryArch.requiredCapabilities;

    // 1. Evaluate all candidates with Thompson sampling and cost metrics
    const candidates: ModelCandidateDecision[] = activeModels.map((model) => {
      const qEstimate = this.qualityTracker.estimateQuality(model, taskDistribution.probabilities);
      const estCost = (estimatedInputTokens / 1_000_000 * model.inputPricePerM) + 
                       (estimatedOutputTokens / 1_000_000 * model.outputPricePerM);

      let isEligible = true;
      let disqualificationReason: string | undefined = undefined;

      // Tier check
      if (enforceTier && model.tier !== enforceTier) {
        isEligible = false;
        disqualificationReason = `Enforced tier '${enforceTier}' mismatch`;
      } else if (!allowedTiers.includes(model.tier)) {
        isEligible = false;
        disqualificationReason = `Tier '${model.tierLabel}' not allowed for active persona`;
      }

      // Capability checks
      if (reqCapabilities.includes('code') && !model.capabilities.code) {
        isEligible = false;
        disqualificationReason = 'Lacks code generation capability';
      }
      if (reqCapabilities.includes('reasoning') && !model.capabilities.reasoning && model.tier === 'low') {
        isEligible = false;
        disqualificationReason = 'Low-tier model lacks multi-step chain-of-thought capability';
      }
      if (reqCapabilities.includes('longContext') && !model.capabilities.longContext && estimatedInputTokens > 80000) {
        isEligible = false;
        disqualificationReason = 'Context window insufficient for long-context synthesis';
      }

      // Quality bar check against Thompson sampled quality draw
      const clearedQualityBar = isEligible && (qEstimate.sampledQuality >= qualityThreshold);

      return {
        model,
        qualityEstimate: qEstimate,
        estimatedCostUsd: Number(estCost.toFixed(7)),
        isEligible,
        clearedQualityBar,
        disqualificationReason: isEligible ? undefined : disqualificationReason,
        isWinner: false,
      };
    });

    let chosenCandidate: ModelCandidateDecision;
    let explored = false;

    // Handle manual enforced model override
    if (enforceModelId) {
      const manual = candidates.find(c => c.model.id === enforceModelId);
      if (manual) {
        chosenCandidate = manual;
        chosenCandidate.isWinner = true;
      } else {
        chosenCandidate = candidates[0];
      }
    } else {
      // Standard Thompson Sampling selection:
      // 1. Filter candidates that cleared the quality threshold
      const passing = candidates.filter(c => c.isEligible && c.clearedQualityBar);

      if (passing.length > 0) {
        // Pick CHEAPEST model among passing draws (cost only tie-breaks among good-enough draws)
        passing.sort((a, b) => {
          if (Math.abs(a.estimatedCostUsd - b.estimatedCostUsd) > 0.0000001) {
            return a.estimatedCostUsd - b.estimatedCostUsd;
          }
          return b.qualityEstimate.sampledQuality - a.qualityEstimate.sampledQuality;
        });

        chosenCandidate = passing[0];
        chosenCandidate.isWinner = true;
        // Explored if sampled quality deviated significantly above mean
        explored = chosenCandidate.qualityEstimate.sampledQuality > (chosenCandidate.qualityEstimate.expectedQuality + 0.08);
      } else {
        // If nothing cleared the caller's quality bar -> serve argmax(sampledQuality)
        const eligible = candidates.filter(c => c.isEligible);
        if (eligible.length > 0) {
          eligible.sort((a, b) => b.qualityEstimate.sampledQuality - a.qualityEstimate.sampledQuality);
          chosenCandidate = eligible[0];
          chosenCandidate.isWinner = true;
        } else {
          chosenCandidate = candidates[0];
          chosenCandidate.isWinner = true;
        }
      }
    }

    // Identify frontier baseline for benchmark comparisons
    const frontierCandidates = activeModels.filter(m => m.tier === 'frontier' || m.tier === 'deep_reasoning');
    const baselineFrontierModel = frontierCandidates.sort((a, b) => b.qualityBenchmarkScore - a.qualityBenchmarkScore)[0] || activeModels[0];

    // Build transparent human-readable reason string
    const sampleVal = chosenCandidate.qualityEstimate.sampledQuality.toFixed(2);
    const meanVal = chosenCandidate.qualityEstimate.expectedQuality.toFixed(2);
    const confVal = (chosenCandidate.qualityEstimate.confidence * 100).toFixed(0);
    const threshVal = qualityThreshold.toFixed(2);
    const costPerCall = (chosenCandidate.estimatedCostUsd * 1000).toFixed(4);

    let routingReason = '';
    if (chosenCandidate.clearedQualityBar) {
      routingReason = `Cheapest model whose Thompson-sampled quality cleared caller bar (${sampleVal} ≥ ${threshVal}). Posterior mean=${meanVal} (${confVal}% conf, cost=$${costPerCall}/1k calls).`;
    } else {
      routingReason = `No candidate cleared quality bar (${threshVal}). Routed to highest sampled quality model (${sampleVal}, mean=${meanVal}) with graceful escalation.`;
    }

    return {
      chosenModel: chosenCandidate.model,
      baselineFrontierModel,
      primaryArchetype: taskDistribution.primaryArchetype,
      taskProbabilities: taskDistribution.probabilities,
      qualityThreshold,
      sampledQuality: chosenCandidate.qualityEstimate.sampledQuality,
      expectedQuality: chosenCandidate.qualityEstimate.expectedQuality,
      confidence: chosenCandidate.qualityEstimate.confidence,
      explored,
      routingReason,
      candidates,
    };
  }
}
