export type TaskArchetypeId =
  | "lookup_extract" | "format_transform" | "draft_summarize"
  | "code_task" | "multi_step_reasoning" | "domain_synthesis" | "deep_research_agentic";

const KEYWORD_RULES: { archetype: TaskArchetypeId; patterns: RegExp[] }[] = [
  { archetype: "lookup_extract", patterns: [/\bwhat is\b/i, /\bextract\b/i, /\bclassify\b/i, /\bpull out\b/i] },
  { archetype: "format_transform", patterns: [/\bconvert\b/i, /\btranslate\b/i, /\breformat\b/i, /\bturn .* into\b/i] },
  { archetype: "code_task", patterns: [/\bcode\b/i, /\bfunction\b/i, /\bdebug\b/i, /\brefactor\b/i, /```/] },
  { archetype: "multi_step_reasoning", patterns: [/\bcompare\b/i, /\bevaluate\b/i, /\btrade-?off/i, /\bbreak down\b/i] },
  { archetype: "domain_synthesis", patterns: [/\bsynthesi[sz]e\b/i, /\breconcile\b/i, /\brisk memo\b/i] },
  { archetype: "deep_research_agentic", patterns: [/\bresearch report\b/i, /\bdeep dive\b/i, /\bmulti-jurisdiction\b/i] },
  { archetype: "draft_summarize", patterns: [/\bsummarize\b/i, /\bdraft\b/i, /\brecap\b/i] },
];

export function classifyArchetype(prompt: string): TaskArchetypeId {
  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((p) => p.test(prompt))) return rule.archetype;
  }
  return "draft_summarize";
}
