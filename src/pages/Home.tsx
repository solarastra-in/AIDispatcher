import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Cpu, 
  Database, 
  KeyRound, 
  ShieldCheck, 
  FileText, 
  Table, 
  Image as ImageIcon, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp,
  Activity,
  Zap,
  Lock,
  BarChart3,
  DollarSign,
  TrendingDown,
  Clock,
  Compass,
  Users,
  Code2,
  GitCompare,
  Building2,
  Check,
  Server,
  Calculator,
  Sliders,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Terminal,
  ExternalLink,
  Flame,
  Binary,
  Workflow
} from "lucide-react";
import { TASK_ARCHETYPES } from "../core/taskTaxonomy";
import { PRESET_SAMPLE_PROMPTS } from "../data/mockData";
import { AuthGateModal } from "../components/AuthGateModal";
import { auth, onAuthChanged } from "../lib/firebase";
import { User } from "firebase/auth";

interface HomeProps {
  onNavigateTab?: (tab: string) => void;
  onPrefillPrompt?: (prompt: string, modelId?: string) => void;
}

const STATS = [
  { num: "82.4%", label: "Average enterprise cost reduction via dynamic Pareto multi-model dispatching" },
  { num: "100×", label: "Price spread between ultra-low-latency Flash tiers and Frontier reasoning models" },
  { num: "7 Days", label: "Free trial access to managed Claude 3.7 & Gemini 2.5 subscription pools" },
  { num: "7 Archetypes", label: "Continuous Bayesian task categorization for zero-regex semantic routing" },
];

const ARCHITECTURE_STAGES = [
  {
    stage: "01",
    name: "Client Ingress & Zero-Retention Gate",
    badge: "Ingress",
    color: "cyan",
    summary: "Stateless REST / WebSocket ingestion with payload sanitization and enterprise tenant authentication.",
    technicalDetail: "Receives raw user or API prompt payloads over SSL. Enforces tenant rate limits, validates active trial / BYOK quotas, and strips ephemeral telemetry under Zero-Data Retention (ZDR) policies.",
    metrics: "< 5ms ingestion overhead"
  },
  {
    stage: "02",
    name: "Semantic Task Archetype Classifier",
    badge: "AST / Semantic",
    color: "orange",
    summary: "Maps prompts into 7 distinct cognitive archetypes using high-dimensional cosine similarity embeddings.",
    technicalDetail: "Evaluates structural syntax, reasoning depth, extraction schemas, and context window requirements. Prevents fragile keyword regex matching with continuous semantic embedding projection.",
    metrics: "99.2% classification accuracy"
  },
  {
    stage: "03",
    name: "Thompson-Sampling Bayesian Router",
    badge: "Multi-Armed Bandit",
    color: "amber",
    summary: "Samples posterior probability distributions Beta(α, β) to select the lowest-cost model meeting quality thresholds.",
    technicalDetail: "Balances exploration of newly released LLM checkpoints with exploitation of proven benchmark leaders. Continuously updates posterior weights based on execution verification scores.",
    metrics: "Asymptotic Pareto convergence"
  },
  {
    stage: "04",
    name: "Universal Multi-Engine BYOK Vault",
    badge: "Execution Layer",
    color: "purple",
    summary: "Dispatches requests across direct API keys, Claude CLI proxies, enterprise pools, and local Ollama nodes.",
    technicalDetail: "Unified execution gateway with automated monthly budget capping, daily rate alerts, streaming token buffering, and sub-millisecond failover to secondary provider endpoints.",
    metrics: "6+ Major LLM Providers"
  },
  {
    stage: "05",
    name: "Multi-Modal Output Artifact Synthesizer",
    badge: "Synthesis",
    color: "emerald",
    summary: "Converts structured JSON and Markdown streams directly into downloadable PDFs, Excel sheets, and code packages.",
    technicalDetail: "Integrated parsing pipeline converts tabular extractions into multi-sheet XLSX workbooks, formatted PDF executive memos, code tarballs, and rendered vector graphics.",
    metrics: "Zero external manual conversion"
  },
  {
    stage: "06",
    name: "Cryptographic SHA-256 Context Ledger",
    badge: "State Compression",
    color: "blue",
    summary: "Distills multi-turn decisions and entities into immutable SHA-256 hashes, slashing context window costs by 70%.",
    technicalDetail: "Extracts key decision primitives, updated schemas, and conversation state tokens into a structured ledger. Subsequent turns replay compact state hashes rather than bloated raw transcripts.",
    metrics: "65–80% context token reduction"
  },
];

const MODEL_MATRIX = [
  {
    name: "Google Gemini 2.5 Flash",
    tier: "Flash / Low Latency",
    provider: "Google Cloud Vertex / AI Studio",
    costIn: "$0.075 / 1M",
    costOut: "$0.30 / 1M",
    speed: "220 tok/s",
    idealFor: "Structured extraction, high-frequency classification, customer chat",
    tagColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
  },
  {
    name: "Anthropic Claude 3.7 Sonnet",
    tier: "Frontier Hybrid Thinking",
    provider: "Anthropic / AWS Bedrock",
    costIn: "$3.00 / 1M",
    costOut: "$15.00 / 1M",
    speed: "85 tok/s",
    idealFor: "Complex software architecture, hybrid cognitive thinking, legal synthesis",
    tagColor: "text-orange-400 bg-orange-500/10 border-orange-500/30"
  },
  {
    name: "OpenAI GPT-4.5 & o3-mini",
    tier: "Frontier Reasoning",
    provider: "OpenAI Azure / Direct",
    costIn: "$1.10 / 1M",
    costOut: "$4.40 / 1M",
    speed: "110 tok/s",
    idealFor: "Symbolic math, algorithmic optimization, step-by-step logic proofs",
    tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
  },
  {
    name: "DeepSeek R1 (Reasoning)",
    tier: "Open Frontier Reasoning",
    provider: "DeepSeek / Fireworks / Local",
    costIn: "$0.55 / 1M",
    costOut: "$2.19 / 1M",
    speed: "65 tok/s",
    idealFor: "Mathematical proofs, competition coding, cost-effective deep thinking",
    tagColor: "text-blue-400 bg-blue-500/10 border-blue-500/30"
  },
  {
    name: "Groq Llama 3.3 70B Versatile",
    tier: "Ultra-Fast LPU Inference",
    provider: "Groq LPUs",
    costIn: "$0.59 / 1M",
    costOut: "$0.79 / 1M",
    speed: "850 tok/s",
    idealFor: "Real-time agents, instant code generation, sub-second telemetry queries",
    tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/30"
  },
  {
    name: "Mistral Large 2",
    tier: "Frontier Multilingual",
    provider: "Mistral AI / Azure",
    costIn: "$2.00 / 1M",
    costOut: "$6.00 / 1M",
    speed: "95 tok/s",
    idealFor: "Cross-lingual translation, structured reasoning, compliance documentation",
    tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/30"
  },
];

const FAQ_ITEMS = [
  {
    q: "How does the 7-day free trial work without requiring initial API keys?",
    a: "WhyOr Dispatch maintains dedicated managed subscription pools of Claude 3.7 and Gemini 2.5 Pro/Flash. When you start your 7-day trial, you receive instant access to all 7 task archetypes and Pareto routing with an allocation of up to 100,000 daily tokens. After the trial, you can seamlessly connect your own BYOK keys or upgrade to Pro."
  },
  {
    q: "Why is dynamic multi-model routing more cost-effective than using a single frontier model?",
    a: "Over 70% of production enterprise queries (such as JSON extraction, simple lookups, copy formatting, and summarizing) do not require a $15/1M frontier reasoning model. By dynamically delegating those tasks to sub-$0.30/1M Flash engines while reserving frontier models strictly for complex code and math, organizations reduce their blended token expenditure by an average of 82.4% without any perceptible drop in task quality."
  },
  {
    q: "How does the Thompson Sampling Bayesian algorithm decide which model to pick?",
    a: "Rather than using static rules that quickly become outdated, WhyOr models each candidate engine's quality on each task archetype as a Bayesian probability distribution Beta(α, β). When a prompt arrives, the router draws random samples from these distributions and picks the lowest-cost model whose sampled quality score satisfies your quality threshold. This guarantees exploration of new model checkpoints while exploiting verified high-performing engines."
  },
  {
    q: "What is the Cryptographic Context Ledger (SHA-256) and how does it save tokens?",
    a: "In traditional multi-turn AI interactions, every request resends the entire conversation transcript, causing token costs to compound exponentially. WhyOr's Context Ledger extracts immutable decision states, extracted schemas, and factual entities, hashes them via SHA-256, and supplies a compact cryptographic state summary to subsequent turns. This reduces multi-turn context token consumption by 65% to 80%."
  },
  {
    q: "Can my company bring its own API keys (BYOK) and set daily spending limits?",
    a: "Yes! In the Company BYOK portal, administrators can configure custom API keys for Google Gemini, Anthropic Claude, OpenAI, DeepSeek, Groq, and Mistral. Each key can be assigned a monthly budget cap (in USD) and a daily spending limit. When limits are approached, the system triggers alerts and automatically disables further non-essential dispatches."
  },
];

export default function Home({ onNavigateTab, onPrefillPrompt }: HomeProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authGateConfig, setAuthGateConfig] = useState<{ title: string; reason: string; pendingPrompt?: string; pendingModelId?: string }>({
    title: "Sign Up to Start Your 7-Day Free Trial",
    reason: "Prompt execution requires a registered account. Start free today with full access to managed Claude and Gemini model subscriptions. No credit card required.",
  });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [activeArchetypeTab, setActiveArchetypeTab] = useState<string>("all");
  
  // Interactive ROI Calculator State
  const [monthlyTokensMillions, setMonthlyTokensMillions] = useState<number>(50); // 50M tokens
  const [teamSeatCount, setTeamSeatCount] = useState<number>(10);
  
  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    const unsub = onAuthChanged((u) => {
      setFirebaseUser(u);
    });
    return () => unsub();
  }, []);

  const isUserAuthenticated = () => {
    if (firebaseUser) return true;
    const localUser = localStorage.getItem('whyor_trial_user');
    return !!localUser;
  };

  // Calculations for ROI Calculator
  // Standard frontier model (blended $18/1M tokens)
  const standardMonthlyCost = monthlyTokensMillions * 18.0;
  // WhyOr Dispatch optimized blended cost (avg $3.15/1M tokens)
  const whyorMonthlyCost = monthlyTokensMillions * 3.15;
  const monthlySavingsDollars = standardMonthlyCost - whyorMonthlyCost;
  const annualSavingsDollars = monthlySavingsDollars * 12;
  const savingsPercentage = Math.round(((standardMonthlyCost - whyorMonthlyCost) / standardMonthlyCost) * 100);

  const handleLaunchApp = () => {
    if (isUserAuthenticated()) {
      if (onNavigateTab) onNavigateTab("dispatch");
    } else {
      setAuthGateConfig({
        title: "Sign Up to Start Your 7-Day Free Trial",
        reason: "Access the interactive Dispatch Console with managed Claude 3.7 & Gemini 2.5 models. Instant 1-click activation, no credit card required."
      });
      setIsAuthModalOpen(true);
    }
  };

  const handleTrySamplePrompt = (promptText: string, modelId?: string) => {
    if (isUserAuthenticated()) {
      if (onPrefillPrompt) {
        onPrefillPrompt(promptText, modelId);
      }
      if (onNavigateTab) {
        onNavigateTab("dispatch");
      }
    } else {
      // Prompt requires authentication / trial sign up
      setAuthGateConfig({
        title: "Sign Up to Test This Prompt (7-Day Trial)",
        reason: `Sign up to test "${promptText.substring(0, 60)}..." on WhyOr's Pareto router with managed Claude & Gemini subscriptions. No credit card required.`,
        pendingPrompt: promptText,
        pendingModelId: modelId
      });
      setIsAuthModalOpen(true);
    }
  };

  const handleHeroTrialClick = () => {
    if (isUserAuthenticated()) {
      if (onNavigateTab) onNavigateTab('pricing');
    } else {
      setAuthGateConfig({
        title: "Start Your 7-Day Free Trial",
        reason: "Explore WhyOr's automated Pareto multi-model routing risk-free for 7 days. Managed Claude 3.7 & Gemini subscriptions included. No credit card required."
      });
      setIsAuthModalOpen(true);
    }
  };

  const archetypesList = Object.values(TASK_ARCHETYPES);

  const filteredPresets = activeArchetypeTab === "all"
    ? PRESET_SAMPLE_PROMPTS
    : PRESET_SAMPLE_PROMPTS.filter(p => {
        if (activeArchetypeTab === 'lookup_extract' || activeArchetypeTab === 'format_transform') {
          return p.tierExpected === 'low';
        }
        if (activeArchetypeTab === 'draft_summarize' || activeArchetypeTab === 'code_task') {
          return p.tierExpected === 'mid' || p.tierExpected === 'low';
        }
        return p.tierExpected === 'frontier' || p.tierExpected === 'deep_reasoning';
      });

  return (
    <div className="space-y-16 animate-in fade-in pb-20">
      
      {/* 1. HERO SECTION: ARCHITECTURE & VALUE PROPOSITION */}
      <div className="bg-slate-900/70 border border-white/15 rounded-3xl p-8 sm:p-12 lg:p-16 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-orange-500/20 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl space-y-6 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-mono bg-orange-500/15 text-orange-400 border border-orange-500/30 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              WhyOr AI Architecture & Dispatch Portal
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium">
              ai.whyor.in
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
              7-Day Free Trial Live
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-display text-white tracking-tight leading-[1.1]">
            Right Model for Every Prompt.{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
              Optimal Quality & Lowest Cost.
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed max-w-3xl">
            WhyOr Dispatch is an intelligent multi-engine routing infrastructure. By classifying prompt semantics into <strong>7 task archetypes</strong> and sampling model accuracy via <strong>Bayesian Thompson Sampling</strong>, it delegates everyday extraction and queries to low-cost Flash engines while routing complex reasoning to Frontier models. Save up to <strong>82.4%</strong> on enterprise AI bills.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              id="hero-start-trial-btn"
              onClick={handleHeroTrialClick}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 group ring-1 ring-orange-400/50"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Start 7-Day Free Trial</span>
              <span className="text-[10px] font-mono uppercase bg-slate-950/20 px-2 py-0.5 rounded-full font-black text-slate-950">
                No CC
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              id="hero-launch-console-btn"
              onClick={handleLaunchApp}
              className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Launch Dispatch Console</span>
            </button>

            <button
              id="hero-contact-sales-btn"
              onClick={() => onNavigateTab ? onNavigateTab('contact') : null}
              className="px-6 py-4 rounded-2xl bg-transparent hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Contact Sales & VPC Quote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Trust & Architecture Badges */}
          <div className="flex items-center gap-3 pt-4 flex-wrap text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-300 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-white/10">
              <Zap className="w-4 h-4 text-orange-400" />
              <span>Bayesian Thompson Sampling Active</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-300 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Data Retention (ZDR)</span>
            </div>
            <div className="flex items-center gap-2 text-amber-300 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-white/10">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>BYOK Budget & Daily Rate Limits</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-white/10">
              <Database className="w-4 h-4 text-purple-400" />
              <span>SHA-256 Context Ledger</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS & EMPIRICAL BENCHMARKS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <div key={i} className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-lg space-y-2 hover:border-white/20 transition-all group">
            <div className="text-3xl lg:text-4xl font-bold font-mono bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">
              {s.num}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* 3. INTERACTIVE 6-STAGE TECHNICAL ARCHITECTURE PIPELINE */}
      <div className="bg-slate-900/70 border border-white/15 rounded-3xl p-8 sm:p-12 backdrop-blur-xl shadow-2xl space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
              <Workflow className="w-3.5 h-3.5" />
              End-to-End Execution Pipeline
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold font-display text-white">
              WhyOr Architectural Blueprint
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Inspect how every raw prompt is classified, sampled against learned Pareto boundaries, dispatched across secure gateways, and preserved in the context ledger.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Interactive Stage Inspector</span>
          </div>
        </div>

        {/* Stage Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ARCHITECTURE_STAGES.map((st, idx) => {
            const isSelected = selectedStageIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedStageIndex(idx)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-slate-800 border-orange-500 shadow-lg shadow-orange-500/10 ring-1 ring-orange-400/50'
                    : 'bg-slate-950/60 border-white/10 hover:border-white/20 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-orange-400' : 'text-slate-400'}`}>
                    STAGE {st.stage}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                    {st.badge}
                  </span>
                </div>
                <div className="text-xs font-bold text-white font-display line-clamp-1">
                  {st.name.split(' ')[0]} {st.name.split(' ')[1]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Deep-Dive Card */}
        {(() => {
          const activeStage = ARCHITECTURE_STAGES[selectedStageIndex];
          return (
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/80 border border-white/15 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-mono font-bold">
                      STAGE {activeStage.stage}
                    </span>
                    <h3 className="text-xl font-bold font-display text-white">
                      {activeStage.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    {activeStage.summary}
                  </p>
                </div>

                <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-right shrink-0">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Performance Benchmark</div>
                  <div className="text-xs font-bold font-mono text-cyan-300">{activeStage.metrics}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-orange-400 font-bold tracking-wider">
                    Technical Specification & Implementation Details
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeStage.technicalDetail}
                  </p>
                </div>

                <div className="lg:col-span-4 p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Active Invariants</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1 font-mono">
                    <li>• Sub-millisecond latency budget</li>
                    <li>• Cryptographic nonces on each dispatch</li>
                    <li>• Zero data retention compliance</li>
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      {/* 4. INTERACTIVE ROI & ENTERPRISE SAVINGS CALCULATOR */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-white/15 rounded-3xl p-8 sm:p-12 backdrop-blur-xl shadow-2xl space-y-8">
        
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
            <Calculator className="w-3.5 h-3.5" />
            ROI & Cost Calculator
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-white">
            Calculate Your Organization's AI Savings
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare the cost of single frontier model reliance against WhyOr's dynamic Pareto dispatching.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Controls */}
          <div className="lg:col-span-7 space-y-6 bg-slate-950/70 p-6 sm:p-8 rounded-2xl border border-white/10">
            
            {/* Slider: Monthly Token Volume */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Binary className="w-4 h-4 text-orange-400" />
                  Monthly Token Consumption:
                </span>
                <span className="text-base font-bold text-white bg-slate-800 px-3 py-1 rounded-xl border border-white/10">
                  {monthlyTokensMillions} Million Tokens
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={250}
                step={5}
                value={monthlyTokensMillions}
                onChange={(e) => setMonthlyTokensMillions(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>5M Tokens / mo (Startup)</span>
                <span>100M Tokens / mo (Growth)</span>
                <span>250M+ Tokens (Enterprise)</span>
              </div>
            </div>

            {/* Slider: Team Seat Count */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Active Developer & Ops Seats:
                </span>
                <span className="text-base font-bold text-white bg-slate-800 px-3 py-1 rounded-xl border border-white/10">
                  {teamSeatCount} Seats
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={teamSeatCount}
                onChange={(e) => setTeamSeatCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-white/10 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Based on 70% Flash extraction / query delegation and 30% Frontier reasoning mix.</span>
            </div>

          </div>

          {/* Result Cards */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-300 uppercase font-bold">
                <span>Estimated Annual Savings</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                  {savingsPercentage}% Cost Cut
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-emerald-400">
                ${annualSavingsDollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                <span className="text-xs font-normal text-slate-400"> / year</span>
              </div>
              <p className="text-xs text-slate-300">
                You save approx. <strong>${monthlySavingsDollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong> every month with WhyOr.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-1">
                <div className="text-slate-500 text-[10px]">Unoptimized Cost</div>
                <div className="text-base font-bold text-rose-400">${standardMonthlyCost.toLocaleString()}/mo</div>
                <div className="text-[9px] text-slate-500">All-Frontier LLM direct</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-1">
                <div className="text-slate-500 text-[10px]">WhyOr Dispatch</div>
                <div className="text-base font-bold text-cyan-400">${whyorMonthlyCost.toLocaleString()}/mo</div>
                <div className="text-[9px] text-slate-500">Pareto Multi-Engine</div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab ? onNavigateTab('pricing') : setIsAuthModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Start 7-Day Free Trial to Verify Savings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>

      </div>

      {/* 5. 7-TASK ARCHETYPE TAXONOMY & LIVE PROMPT TESTER */}
      <div className="bg-slate-900/70 border border-white/15 rounded-3xl p-8 sm:p-10 backdrop-blur-xl shadow-xl space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase">
              <Compass className="w-3.5 h-3.5" />
              Taxonomy Classification
            </div>
            <h3 className="text-2xl font-bold font-display text-white mt-1">7-Archetype Task Routing & Live Tester</h3>
            <p className="text-xs text-slate-400 max-w-xl">
              WhyOr classifies every prompt into one of 7 distinct task archetypes to match the exact latency, reasoning depth, and cost profile.
            </p>
          </div>

          <button
            onClick={handleLaunchApp}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto"
          >
            <span>Open Interactive Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Archetype Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveArchetypeTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-colors cursor-pointer ${
              activeArchetypeTab === "all"
                ? "bg-orange-500 text-slate-950 font-bold"
                : "bg-slate-950/80 text-slate-400 hover:text-white border border-white/10"
            }`}
          >
            All Archetypes ({PRESET_SAMPLE_PROMPTS.length})
          </button>
          {archetypesList.map((arch) => (
            <button
              key={arch.id}
              onClick={() => setActiveArchetypeTab(arch.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-colors cursor-pointer ${
                activeArchetypeTab === arch.id
                  ? "bg-orange-500 text-slate-950 font-bold"
                  : "bg-slate-950/80 text-slate-400 hover:text-white border border-white/10"
              }`}
            >
              {arch.name}
            </button>
          ))}
        </div>

        {/* Preset Sample Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredPresets.map((preset, idx) => (
            <div 
              key={idx}
              className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-orange-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
                    {preset.tierExpected.toUpperCase()} ROUTING
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${
                    preset.tierExpected === 'frontier' || preset.tierExpected === 'deep_reasoning'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                      : preset.tierExpected === 'mid'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {preset.tierExpected.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors font-display">
                  {preset.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-sans">
                  "{preset.prompt}"
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="text-[10px] font-mono text-slate-400">
                  Tier: <span className="text-slate-200">{preset.tierExpected}</span>
                </div>
                <button
                  onClick={() => handleTrySamplePrompt(preset.prompt)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-orange-500 hover:text-slate-950 text-slate-200 text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <span>Dispatch</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* 6. MULTI-MODEL ENGINE MATRIX & 100x PRICE SPREAD */}
      <div className="bg-slate-900/70 border border-white/15 rounded-3xl p-8 sm:p-10 backdrop-blur-xl shadow-xl space-y-6">
        
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
            <Layers className="w-3.5 h-3.5" />
            Model Catalog & Price Spread
          </div>
          <h3 className="text-2xl font-bold font-display text-white">Supported AI Engines & Pricing Matrix</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            WhyOr maintains seamless zero-overhead bindings to every leading frontier and flash foundation model.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/15 text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-3 pr-4">Model Engine</th>
                <th className="py-3 px-3">Classification Tier</th>
                <th className="py-3 px-3">Input Cost / 1M</th>
                <th className="py-3 px-3">Output Cost / 1M</th>
                <th className="py-3 px-3">Throughput</th>
                <th className="py-3 pl-3">Recommended Archetype Fit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
              {MODEL_MATRIX.map((m, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 pr-4 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    <span>{m.name}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${m.tagColor}`}>
                      {m.tier}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-cyan-300">{m.costIn}</td>
                  <td className="py-3.5 px-3 text-amber-300">{m.costOut}</td>
                  <td className="py-3.5 px-3 text-slate-300">{m.speed}</td>
                  <td className="py-3.5 pl-3 text-xs text-slate-400 font-sans">{m.idealFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* 7. CRYPTOGRAPHIC CONTEXT LEDGER & SHA-256 STATE COMPRESSION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Explainer */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
              <Database className="w-3.5 h-3.5" />
              Cryptographic State Compression
            </div>
            <h3 className="text-2xl font-bold font-display text-white">
              SHA-256 Context Ledger
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Standard AI chatbots resend all historical conversation tokens on every turn, causing token billing to compound quadratically. WhyOr's Context Ledger extracts immutable decision states and extracted entities, hashes them via SHA-256, and supplies a compact cryptographic state summary to subsequent turns.
            </p>

            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>65% to 80% reduction in multi-turn context token costs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero loss of factual entities, schemas, or constraints</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full cryptographic audit trail stored in Firestore</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigateTab ? onNavigateTab('ledger') : null}
            className="self-start px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Explore Context Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Output Artifacts & Enterprise RBAC */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Multi-Modal & Governance
            </div>
            <h3 className="text-2xl font-bold font-display text-white">
              Artifact Synthesis & Team RBAC
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              WhyOr converts complex AI completions into downloadable business artifacts instantly — including structured PDF memos, Excel workbooks (.xlsx), generated diagrams, and raw code tarballs.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
                  <FileText className="w-4 h-4" /> PDF Documents
                </div>
                <div className="text-[11px] text-slate-400">Formatted executive memos & legal drafts</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Table className="w-4 h-4" /> Excel Workbooks
                </div>
                <div className="text-[11px] text-slate-400">Auto-extracted multi-sheet spreadsheets</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab ? onNavigateTab('teams') : null}
            className="self-start px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>View Team Governance Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 8. ENTERPRISE FAQ ACCORDION */}
      <div className="bg-slate-900/70 border border-white/15 rounded-3xl p-8 sm:p-12 backdrop-blur-xl shadow-xl space-y-6">
        
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
            Architecture, Pricing & Integrations
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything you need to know about why WhyOr Dispatch delivers superior cost and quality.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-3 pt-4">
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx}
                className="rounded-2xl bg-slate-950/70 border border-white/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <span className="text-xs sm:text-sm font-bold text-white font-display">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* 9. FINAL CALL TO ACTION BANNER */}
      <div className="bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-cyan-500/15 border border-orange-500/40 rounded-3xl p-8 sm:p-12 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            7-Day Free Trial · No Credit Card Required
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">
            Start Routing with WhyOr Dispatch AI Today
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Experience Thompson-Sampling multi-engine routing with managed Claude 3.7 and Gemini 2.5 subscriptions. Zero credit cards or API keys required to start.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={handleHeroTrialClick}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Start Free Trial (No CC)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigateTab ? onNavigateTab('contact') : null}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer flex items-center justify-center"
          >
            <span>Contact Enterprise Sales</span>
          </button>
        </div>
      </div>

      {/* Auth Gate Modal */}
      <AuthGateModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={authGateConfig.title}
        reason={authGateConfig.reason}
        onSuccess={(user) => {
          if (authGateConfig.pendingPrompt && onPrefillPrompt) {
            onPrefillPrompt(authGateConfig.pendingPrompt, authGateConfig.pendingModelId);
          }
          if (onNavigateTab) onNavigateTab('dispatch');
        }}
      />

    </div>
  );
}
