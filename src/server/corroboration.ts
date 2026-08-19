export type FactType = "number" | "percentage" | "currency" | "date" | "entity";

export interface ExtractedFact {
  type: FactType;
  value: string;
  rawText: string;
  contextWords: string[];
  sentenceIndex: number;
}

export interface FactComparison {
  status: "agree" | "contradict" | "unique_to_a" | "unique_to_b";
  factA: ExtractedFact | null;
  factB: ExtractedFact | null;
  impact: "high" | "medium" | "low";
  note: string;
}

export interface CorroborationResult {
  agreementScore: number | null;
  comparableFactCount: number;
  agreements: FactComparison[];
  contradictions: FactComparison[];
  uniqueToA: FactComparison[];
  uniqueToB: FactComparison[];
  highImpactContradictionCount: number;
}

const CONTEXT_WINDOW = 4;

const PATTERNS: { type: FactType; regex: RegExp }[] = [
  { type: "currency", regex: /\$[\d,]+(?:\.\d+)?\s?(?:million|billion|k|M|B)?/gi },
  { type: "percentage", regex: /\d+(?:\.\d+)?\s?%/g },
  { type: "date", regex: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/gi },
  { type: "number", regex: /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g },
];

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
}

export function extractFacts(text: string): ExtractedFact[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const facts: ExtractedFact[] = [];

  sentences.forEach((sentence, sentenceIndex) => {
    const claimedRanges: [number, number][] = [];

    for (const { type, regex } of PATTERNS) {
      const re = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
      let match: RegExpExecArray | null;
      while ((match = re.exec(sentence)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (type === "number" && claimedRanges.some(([s, e]) => start < e && end > s)) continue;
        claimedRanges.push([start, end]);

        const before = tokenize(sentence.slice(Math.max(0, start - 40), start)).slice(-CONTEXT_WINDOW);
        const after = tokenize(sentence.slice(end, end + 40)).slice(0, CONTEXT_WINDOW);

        facts.push({
          type, value: normalizeValue(type, match[0]), rawText: match[0],
          contextWords: [...before, ...after], sentenceIndex,
        });
      }
    }

    const words = sentence.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const stripped = words[i].replace(/[.,!?]$/, "");
      if (/^[A-Z][a-zA-Z]+$/.test(stripped) && !isCommonWord(stripped)) {
        let span = stripped;
        let j = i + 1;
        while (j < words.length && j < i + 3 && /^[A-Z][a-zA-Z]+$/.test(words[j].replace(/[.,!?]$/, ""))) {
          span += " " + words[j].replace(/[.,!?]$/, "");
          j++;
        }
        const before = tokenize(words.slice(Math.max(0, i - CONTEXT_WINDOW), i).join(" "));
        const after = tokenize(words.slice(j, j + CONTEXT_WINDOW).join(" "));
        facts.push({ type: "entity", value: span, rawText: span, contextWords: [...before, ...after], sentenceIndex });
        i = j - 1;
      }
    }
  });

  return facts;
}

function normalizeValue(type: FactType, raw: string): string {
  if (type === "number" || type === "currency") return raw.replace(/[$,]/g, "").trim();
  if (type === "percentage") return raw.replace(/\s/g, "");
  return raw.trim();
}

const COMMON_SENTENCE_STARTERS = new Set([
  "The", "This", "That", "These", "Those", "It", "There", "We", "I", "A", "An",
  "Revenue", "Occupancy", "Property", "Building", "Total", "Based", "According",
  "Given", "Please", "Note", "As", "In", "On", "For", "With", "At", "After", "Before",
]);
function isCommonWord(word: string): boolean {
  return COMMON_SENTENCE_STARTERS.has(word);
}

function contextSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

const CONTEXT_MATCH_THRESHOLD = 0.2;
const ENTITY_CONTEXT_MATCH_THRESHOLD = 0.5;

export function compareFacts(factsA: ExtractedFact[], factsB: ExtractedFact[]): CorroborationResult {
  const usedB = new Set<number>();
  const agreements: FactComparison[] = [];
  const contradictions: FactComparison[] = [];
  const uniqueToA: FactComparison[] = [];
  const uniqueToB: FactComparison[] = [];

  for (const factA of factsA) {
    let bestMatchFact: ExtractedFact | null = null;
    let bestMatchIndex = -1;
    let bestMatchSimilarity = 0;

    for (let idx = 0; idx < factsB.length; idx++) {
      const factB = factsB[idx];
      if (usedB.has(idx) || factB.type !== factA.type) continue;
      const sim = contextSimilarity(factA.contextWords, factB.contextWords);
      const threshold = factA.type === "entity" ? ENTITY_CONTEXT_MATCH_THRESHOLD : CONTEXT_MATCH_THRESHOLD;
      if (sim >= threshold && sim > bestMatchSimilarity) {
        bestMatchFact = factB;
        bestMatchIndex = idx;
        bestMatchSimilarity = sim;
      }
    }

    if (bestMatchFact) {
      usedB.add(bestMatchIndex);
      if (valuesMatch(factA, bestMatchFact)) {
        agreements.push({ status: "agree", factA, factB: bestMatchFact, impact: "low", note: `Both models state ${factA.rawText}` });
      } else {
        const impact = classifyContradictionImpact(factA, bestMatchFact);
        contradictions.push({
          status: "contradict", factA, factB: bestMatchFact, impact,
          note: `Model A says ${factA.rawText}, Model B says ${bestMatchFact.rawText} — same subject, different value.`,
        });
      }
    } else {
      uniqueToA.push({ status: "unique_to_a", factA, factB: null, impact: "medium", note: `Only Model A mentions ${factA.rawText}` });
    }
  }

  factsB.forEach((factB, idx) => {
    if (!usedB.has(idx)) {
      uniqueToB.push({ status: "unique_to_b", factA: null, factB, impact: "medium", note: `Only Model B mentions ${factB.rawText}` });
    }
  });

  const comparableFactCount = agreements.length + contradictions.length;
  const agreementScore = comparableFactCount > 0 ? Math.round((agreements.length / comparableFactCount) * 1000) / 10 : null;

  return {
    agreementScore, comparableFactCount, agreements, contradictions, uniqueToA, uniqueToB,
    highImpactContradictionCount: contradictions.filter((c) => c.impact === "high").length,
  };
}

function valuesMatch(a: ExtractedFact, b: ExtractedFact): boolean {
  if (a.type === "entity") return a.value.toLowerCase() === b.value.toLowerCase();
  return a.value === b.value;
}

function classifyContradictionImpact(a: ExtractedFact, b: ExtractedFact): "high" | "medium" | "low" {
  if (a.type === "number" || a.type === "currency") {
    const numA = parseFloat(a.value);
    const numB = parseFloat(b.value);
    if (!isNaN(numA) && !isNaN(numB) && numA !== 0) {
      const relativeDiff = Math.abs(numA - numB) / Math.abs(numA);
      if (relativeDiff < 0.05) return "low";
      if (relativeDiff < 0.25) return "medium";
      return "high";
    }
  }
  return "high";
}
