import { ModelTier, ModelCapability } from '../types';

export type TaskArchetypeId = 
  | 'lookup_extract'
  | 'format_transform'
  | 'draft_summarize'
  | 'code_task'
  | 'multi_step_reasoning'
  | 'domain_synthesis'
  | 'deep_research_agentic';

export interface TaskArchetype {
  id: TaskArchetypeId;
  name: string;
  tierHint: ModelTier;
  requiredCapabilities: (keyof ModelCapability)[];
  description: string;
  exampleUtterances: string[];
}

export const TASK_ARCHETYPES: Record<TaskArchetypeId, TaskArchetype> = {
  lookup_extract: {
    id: 'lookup_extract',
    name: 'Lookup & Extraction',
    tierHint: 'low',
    requiredCapabilities: ['jsonOutput'],
    description: 'Direct factual retrieval, entity extraction, string parsing, and structured key-value mapping from provided text.',
    exampleUtterances: [
      "What is the due date on this invoice?",
      "Extract the company names, addresses, and tax IDs from this text.",
      "Parse this receipt into JSON key-value pairs.",
      "What is the customer's phone number and account ID in this email thread?",
      "Find the error code and timestamp in this server log entry.",
      "Extract all email addresses and phone numbers from the following contact list.",
      "What is the total purchase amount listed on this transaction receipt?",
      "Parse this vendor address into street, suite, city, state, and postal code.",
      "Identify the order number and shipping carrier from this confirmation message.",
      "Extract all invoice line items and unit quantities into structured JSON."
    ]
  },
  format_transform: {
    id: 'format_transform',
    name: 'Format & Transform',
    tierHint: 'low',
    requiredCapabilities: ['jsonOutput'],
    description: 'Deterministic restructuring, table formatting, syntax transformation, CSV/JSON conversion, and schema alignment.',
    exampleUtterances: [
      "Convert this list of product features into a markdown table.",
      "Transform this CSV table into a clean JSON array of objects.",
      "Reformat these dates into ISO 8601 YYYY-MM-DD standard format.",
      "Convert this raw text into structured bullet points with bold keywords.",
      "Normalize these messy postal addresses into standard USPS format.",
      "Convert this XML snippet into equivalent TypeScript interface definitions.",
      "Format these numeric rows into currency strings with two decimal places.",
      "Reorganize these messy log statements into chronological order with tabular columns.",
      "Convert this YAML configuration into equivalent TOML syntax.",
      "Transform this markdown outline into HTML5 unordered list tags."
    ]
  },
  draft_summarize: {
    id: 'draft_summarize',
    name: 'Draft & Summarize',
    tierHint: 'mid',
    requiredCapabilities: [],
    description: 'Routine prose generation, executive summaries, email drafts, editing, and concise text distillation.',
    exampleUtterances: [
      "Summarize this investor update in three clear bullet points.",
      "Draft a polite follow-up email to a prospective enterprise customer.",
      "Write a 2-paragraph executive summary of this quarterly financial report.",
      "Rephrase this internal product announcement in a more professional tone.",
      "Create a concise TL;DR of this product release note for the weekly newsletter.",
      "Draft a courteous response to this customer support ticket regarding shipping delays.",
      "Condense this 5-page transcript into key action items and decisions.",
      "Write an introductory blog post explaining our new feature release.",
      "Rewrite this paragraph to improve readability, clarity, and grammatical precision.",
      "Summarize the key takeaways from today's design sprint meeting."
    ]
  },
  code_task: {
    id: 'code_task',
    name: 'Code & Refactor',
    tierHint: 'mid',
    requiredCapabilities: ['code'],
    description: 'Software development, bug fixing, SQL queries, TypeScript types, unit tests, and code refactoring.',
    exampleUtterances: [
      "Fix the bug in this TypeScript async queue function.",
      "Write a TypeScript function to debounce an API call with cancel token support.",
      "Write an optimized PostgreSQL query to find the top 5 customers by revenue per region.",
      "Refactor this React hook to prevent unnecessary dependency re-renders.",
      "Write a regex to match valid international E.164 phone numbers with area codes.",
      "Write Jest unit tests covering edge cases for this monetary calculation helper.",
      "Implement a binary search tree in Python with insert, search, and delete methods.",
      "Convert this Express router into a FastAPI asynchronous endpoint.",
      "Fix this Dockerfile multi-stage build that is failing on node-gyp compilation.",
      "Write a Kubernetes deployment manifest with liveness probes and resource limits."
    ]
  },
  multi_step_reasoning: {
    id: 'multi_step_reasoning',
    name: 'Multi-Step Reasoning',
    tierHint: 'high',
    requiredCapabilities: ['reasoning'],
    description: 'Comparative evaluations, trade-off analyses, multi-criteria decision making, and strategic architectural deduction.',
    exampleUtterances: [
      "Compare these three financing options and recommend the optimal one for our cash flow.",
      "Break down why this deal underperformed relative to projections and identify root causes.",
      "Evaluate the architectural trade-offs of migrating from DynamoDB to Spanner for this workload.",
      "Analyze this supply chain disruption scenario and propose a phased mitigation strategy.",
      "Calculate the optimal dynamic pricing strategy given these demand elasticity metrics.",
      "Assess whether we should build or buy this search infrastructure based on these cost models.",
      "Evaluate the competitive positioning of these two SaaS products across pricing and feature sets.",
      "Formulate a quantitative hypothesis for our user retention drop after the v2 release.",
      "Compare these three database migration strategies considering zero-downtime requirements.",
      "Analyze the systemic failure modes in this distributed transaction architecture."
    ]
  },
  domain_synthesis: {
    id: 'domain_synthesis',
    name: 'Domain Synthesis & Long Context',
    tierHint: 'high',
    requiredCapabilities: ['reasoning', 'longContext'],
    description: 'Cross-document synthesis, multi-jurisdictional legal analysis, comprehensive medical/financial audit, and large context evaluations.',
    exampleUtterances: [
      "Synthesize the key risks and indemnification obligations across all 5 attached lease documents.",
      "Cross-reference these clinical trial findings against established FDA treatment guidelines.",
      "Audit this multi-jurisdictional compliance checklist for direct conflicts between GDPR and CCPA.",
      "Synthesize quarterly financial statements across 4 fiscal years to identify hidden margin leakage.",
      "Evaluate this patent claims portfolio for freedom-to-operate risks in commercial automotive LIDAR.",
      "Review this 80-page merger agreement and highlight non-standard break fees or representations.",
      "Synthesize user interview transcripts across 40 customer calls into a unified UX journey map.",
      "Compare these 6 insurance policy riders for overlapping coverage limits and exclusion gaps.",
      "Analyze these historical earnings call transcripts for shifting management guidance tone.",
      "Consolidate environmental impact assessments across 3 municipal development proposals."
    ]
  },
  deep_research_agentic: {
    id: 'deep_research_agentic',
    name: 'Deep Research & Formal Reasoning',
    tierHint: 'frontier',
    requiredCapabilities: ['reasoning'],
    description: 'Formal mathematical proofs, multi-jurisdictional deep investigative research, theoretical derivations, and agentic workflows.',
    exampleUtterances: [
      "Research this market across every relevant jurisdiction and build a comprehensive macroeconomic report.",
      "Formulate a rigorous mathematical proof for subgradient convergence in non-smooth convex optimization.",
      "Develop an end-to-end multi-agent workflow to automate complex cross-border KYC and AML investigations.",
      "Conduct a comprehensive competitive teardown of AI router architectures and benchmark quality frontiers.",
      "Derive the closed-form Bayesian posterior for this non-conjugate prior using variational inference.",
      "Synthesize global regulatory filings across 12 countries to forecast antitrust enforcement probability.",
      "Build a formal formal verification specification in TLA+ for this distributed consensus protocol.",
      "Analyze the cryptographic security bounds of this lattice-based post-quantum key exchange scheme.",
      "Conduct deep research on solid-state battery manufacturing yields and bottleneck supply chains.",
      "Develop a theoretical framework for bounding generalization error in overparameterized neural networks."
    ]
  }
};
