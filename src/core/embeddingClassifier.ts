import { TASK_ARCHETYPES, TaskArchetypeId } from './taskTaxonomy';

export interface TaskProbabilityDistribution {
  probabilities: Record<TaskArchetypeId, number>;
  primaryArchetype: TaskArchetypeId;
  confidence: number;
  entropy: number;
  reasoning: string;
}

// Tokenize text into normalized word n-grams (1-gram and 2-grams)
function tokenizeAndNgrams(text: string): string[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9_\s]/g, ' ');
  const words = clean.split(/\s+/).filter(w => w.length > 1);
  const tokens: string[] = [...words];

  // Add bigrams
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]}_${words[i + 1]}`);
  }

  return tokens;
}

// Compute TF vector for a document given a vocabulary
function computeTfVector(tokens: string[], vocabulary: Map<string, number>): Float64Array {
  const vec = new Float64Array(vocabulary.size);
  const tokenCounts = new Map<string, number>();

  for (const t of tokens) {
    tokenCounts.set(t, (tokenCounts.get(t) || 0) + 1);
  }

  const totalTokens = tokens.length || 1;
  tokenCounts.forEach((count, token) => {
    const idx = vocabulary.get(token);
    if (idx !== undefined) {
      // Sublinear TF scaling: 1 + log(tf)
      vec[idx] = 1 + Math.log(count / totalTokens + 1);
    }
  });

  // Normalize to unit vector L2
  let normSq = 0;
  for (let i = 0; i < vec.length; i++) {
    normSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(normSq);
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) {
      vec[i] /= norm;
    }
  }

  return vec;
}

// Cosine similarity between two normalized vectors is the dot product
function cosineSimilarity(a: Float64Array, b: Float64Array): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

class SoftCentroidClassifier {
  private vocabulary: Map<string, number> = new Map();
  private archetypeCentroids: Record<TaskArchetypeId, Float64Array> = {} as any;
  private isInitialized = false;

  constructor() {
    this.buildCentroids();
  }

  private buildCentroids() {
    // 1. Build master vocabulary from all archetype example utterances
    let vocabIndex = 0;
    const allArchetypes = Object.values(TASK_ARCHETYPES);

    for (const arch of allArchetypes) {
      for (const utterance of arch.exampleUtterances) {
        const tokens = tokenizeAndNgrams(utterance);
        for (const t of tokens) {
          if (!this.vocabulary.has(t)) {
            this.vocabulary.set(t, vocabIndex++);
          }
        }
      }
    }

    // 2. Compute centroid embedding for each archetype
    for (const arch of allArchetypes) {
      const centroid = new Float64Array(this.vocabulary.size);
      for (const utterance of arch.exampleUtterances) {
        const tokens = tokenizeAndNgrams(utterance);
        const tfVec = computeTfVector(tokens, this.vocabulary);
        for (let i = 0; i < centroid.length; i++) {
          centroid[i] += tfVec[i];
        }
      }

      // Average and L2 normalize
      const count = arch.exampleUtterances.length || 1;
      let normSq = 0;
      for (let i = 0; i < centroid.length; i++) {
        centroid[i] /= count;
        normSq += centroid[i] * centroid[i];
      }
      const norm = Math.sqrt(normSq);
      if (norm > 0) {
        for (let i = 0; i < centroid.length; i++) {
          centroid[i] /= norm;
        }
      }

      this.archetypeCentroids[arch.id] = centroid;
    }

    this.isInitialized = true;
  }

  /**
   * Classify prompt into a probability distribution over the 7 archetypes using Softmax(Sim / Temperature)
   */
  public classify(prompt: string, temperature = 0.28): TaskProbabilityDistribution {
    if (!this.isInitialized) {
      this.buildCentroids();
    }

    const tokens = tokenizeAndNgrams(prompt);
    const inputVec = computeTfVector(tokens, this.vocabulary);

    const rawSimilarities: Record<TaskArchetypeId, number> = {} as any;
    const allArchetypes = Object.values(TASK_ARCHETYPES);

    // Compute cosine similarity against each centroid
    for (const arch of allArchetypes) {
      const centroid = this.archetypeCentroids[arch.id];
      const sim = cosineSimilarity(inputVec, centroid);
      // Boost with structural heuristics for extreme clarity
      let heuristicBoost = 0;
      const lower = prompt.toLowerCase();

      if (arch.id === 'code_task' && (/```|def |function |class |sql|typescript|docker|async /i.test(prompt))) {
        heuristicBoost += 0.45;
      } else if (arch.id === 'deep_research_agentic' && (/proof|derive|convex|subgradient|macroeconomic|formal verification|security bounds/i.test(lower))) {
        heuristicBoost += 0.55;
      } else if (arch.id === 'multi_step_reasoning' && (/compare|break down|underperformed|trade-off|mitigation|evaluate|projections/i.test(lower))) {
        heuristicBoost += 0.40;
      } else if (arch.id === 'domain_synthesis' && (/synthesize|lease documents|clinical trial|multi-jurisdictional|compliance checklist|4 fiscal years/i.test(lower))) {
        heuristicBoost += 0.45;
      } else if (arch.id === 'lookup_extract' && (/extract|due date|invoice|receipt|phone number|parse this into json/i.test(lower))) {
        heuristicBoost += 0.35;
      } else if (arch.id === 'format_transform' && (/convert this list into a markdown table|transform this csv|reformat these dates/i.test(lower))) {
        heuristicBoost += 0.40;
      } else if (arch.id === 'draft_summarize' && (/summarize this|draft a polite follow-up|write a 2-paragraph executive summary|tl;dr/i.test(lower))) {
        heuristicBoost += 0.35;
      }

      rawSimilarities[arch.id] = Math.max(0.01, sim + heuristicBoost);
    }

    // Softmax with temperature
    let expSum = 0;
    const expScores: Record<TaskArchetypeId, number> = {} as any;

    for (const arch of allArchetypes) {
      const exp = Math.exp(rawSimilarities[arch.id] / temperature);
      expScores[arch.id] = exp;
      expSum += exp;
    }

    const probabilities: Record<TaskArchetypeId, number> = {} as any;
    let maxProb = -1;
    let primaryArchetype: TaskArchetypeId = 'draft_summarize';
    let entropy = 0;

    for (const arch of allArchetypes) {
      const p = expScores[arch.id] / expSum;
      probabilities[arch.id] = Number(p.toFixed(4));
      if (p > maxProb) {
        maxProb = p;
        primaryArchetype = arch.id;
      }
      if (p > 0.0001) {
        entropy -= p * Math.log2(p);
      }
    }

    const confidence = Number(maxProb.toFixed(4));
    const archName = TASK_ARCHETYPES[primaryArchetype].name;
    const reasoning = `Softmax semantic centroid classifier mapped prompt to ${archName} with ${(confidence * 100).toFixed(1)}% probability distribution confidence.`;

    return {
      probabilities,
      primaryArchetype,
      confidence,
      entropy: Number(entropy.toFixed(3)),
      reasoning,
    };
  }
}

// Singleton instance
export const softClassifier = new SoftCentroidClassifier();
