import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  Layers,
  Sparkles,
  Users,
  Shield,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { UserPersona, ModelTier } from '../types';
import { PERSONA_PROFILES } from '../data/mockData';
import { TASK_ARCHETYPES } from '../core/taskTaxonomy';

interface SavingsAnalyticsDashboardProps {
  activePersona: UserPersona;
  onNavigateTab?: (tab: string) => void;
  onPrefillPrompt?: (prompt: string) => void;
}

// Color palettes for Recharts
const COLORS = {
  emerald: '#10b981',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  orange: '#f97316',
  purple: '#a855f7',
  blue: '#3b82f6',
  rose: '#f43f5e',
  slate: '#64748b'
};

const PROVIDER_COLORS: Record<string, string> = {
  google: '#06b6d4',
  anthropic: '#f59e0b',
  openai: '#10b981',
  deepseek: '#3b82f6',
  mistral: '#a855f7',
  groq: '#f43f5e',
  other: '#64748b'
};

const TIER_COLORS: Record<ModelTier, string> = {
  low: '#06b6d4',
  mid: '#10b981',
  high: '#f59e0b',
  frontier: '#a855f7',
  deep_reasoning: '#f97316'
};

// Initial time-series mock telemetry points
const INITIAL_TIMELINE_DATA = [
  { time: '00:00', baselineTokens: 42000, routedTokens: 14500, savedTokens: 27500, baselineCost: 0.126, actualCost: 0.024, savingsUsd: 0.102, requests: 85 },
  { time: '02:00', baselineTokens: 38000, routedTokens: 12800, savedTokens: 25200, baselineCost: 0.114, actualCost: 0.021, savingsUsd: 0.093, requests: 74 },
  { time: '04:00', baselineTokens: 29000, routedTokens: 9600, savedTokens: 19400, baselineCost: 0.087, actualCost: 0.015, savingsUsd: 0.072, requests: 58 },
  { time: '06:00', baselineTokens: 52000, routedTokens: 18400, savedTokens: 33600, baselineCost: 0.156, actualCost: 0.031, savingsUsd: 0.125, requests: 110 },
  { time: '08:00', baselineTokens: 118000, routedTokens: 41200, savedTokens: 76800, baselineCost: 0.354, actualCost: 0.068, savingsUsd: 0.286, requests: 245 },
  { time: '10:00', baselineTokens: 194000, routedTokens: 64500, savedTokens: 129500, baselineCost: 0.582, actualCost: 0.108, savingsUsd: 0.474, requests: 380 },
  { time: '12:00', baselineTokens: 245000, routedTokens: 79800, savedTokens: 165200, baselineCost: 0.735, actualCost: 0.134, savingsUsd: 0.601, requests: 460 },
  { time: '14:00', baselineTokens: 280000, routedTokens: 91000, savedTokens: 189000, baselineCost: 0.840, actualCost: 0.152, savingsUsd: 0.688, requests: 512 },
  { time: '16:00', baselineTokens: 262000, routedTokens: 86400, savedTokens: 175600, baselineCost: 0.786, actualCost: 0.144, savingsUsd: 0.642, requests: 480 },
  { time: '18:00', baselineTokens: 185000, routedTokens: 61500, savedTokens: 123500, baselineCost: 0.555, actualCost: 0.102, savingsUsd: 0.453, requests: 350 },
  { time: '20:00', baselineTokens: 132000, routedTokens: 43800, savedTokens: 88200, baselineCost: 0.396, actualCost: 0.073, savingsUsd: 0.323, requests: 260 },
  { time: '22:00', baselineTokens: 88000, routedTokens: 29500, savedTokens: 58500, baselineCost: 0.264, actualCost: 0.049, savingsUsd: 0.215, requests: 175 },
];

// Persona usage and tier distribution breakdown data
const PERSONA_USAGE_DATA = [
  {
    personaName: 'Guest (Anonymous)',
    role: 'guest',
    totalCalls: 1240,
    totalTokens: 1420000,
    savedTokens: 1020000,
    savedUsd: 284.50,
    lowTier: 78,
    midTier: 22,
    highTier: 0,
    frontierTier: 0,
    deepReasoningTier: 0,
    avgSavingsPercent: 71.8
  },
  {
    personaName: 'Pro Developer (Alex)',
    role: 'user',
    totalCalls: 8420,
    totalTokens: 38400000,
    savedTokens: 26100000,
    savedUsd: 6140.20,
    lowTier: 35,
    midTier: 40,
    highTier: 18,
    frontierTier: 5,
    deepReasoningTier: 2,
    avgSavingsPercent: 67.9
  },
  {
    personaName: 'Team Member (Sarah)',
    role: 'team_member',
    totalCalls: 14500,
    totalTokens: 56200000,
    savedTokens: 38900000,
    savedUsd: 8940.80,
    lowTier: 42,
    midTier: 38,
    highTier: 15,
    frontierTier: 5,
    deepReasoningTier: 0,
    avgSavingsPercent: 69.2
  },
  {
    personaName: 'Team Admin (Acme AI)',
    role: 'team_admin',
    totalCalls: 6200,
    totalTokens: 28900000,
    savedTokens: 18500000,
    savedUsd: 4320.00,
    lowTier: 28,
    midTier: 35,
    highTier: 24,
    frontierTier: 10,
    deepReasoningTier: 3,
    avgSavingsPercent: 64.0
  },
  {
    personaName: 'Platform Operator (Elena)',
    role: 'platform_admin',
    totalCalls: 18900,
    totalTokens: 142000000,
    savedTokens: 92400000,
    savedUsd: 21850.00,
    lowTier: 48,
    midTier: 32,
    highTier: 12,
    frontierTier: 6,
    deepReasoningTier: 2,
    avgSavingsPercent: 65.1
  }
];

// Provider share data
const PROVIDER_SHARE_DATA = [
  { name: 'Google DeepMind', provider: 'google', tokens: 112000000, percent: 41, costUsd: 14200 },
  { name: 'Anthropic', provider: 'anthropic', tokens: 74000000, percent: 27, costUsd: 28400 },
  { name: 'DeepSeek', provider: 'deepseek', tokens: 42000000, percent: 15, costUsd: 4100 },
  { name: 'OpenAI', provider: 'openai', tokens: 28000000, percent: 10, costUsd: 12200 },
  { name: 'Mistral AI', provider: 'mistral', tokens: 12000000, percent: 4, costUsd: 2900 },
  { name: 'Groq LPU', provider: 'groq', tokens: 8000000, percent: 3, costUsd: 950 },
];

// Task Archetype efficiency data
const ARCHETYPE_EFFICIENCY_DATA = [
  { archetype: 'Lookup & Extract', name: 'Lookup & Extract', baselineTokens: 450, routedTokens: 85, savingsPercent: 81.1, costAvoidance: '$0.0018/call' },
  { archetype: 'Format & Transform', name: 'Format & Transform', baselineTokens: 620, routedTokens: 110, savingsPercent: 82.3, costAvoidance: '$0.0024/call' },
  { archetype: 'Draft & Summarize', name: 'Draft & Summarize', baselineTokens: 880, routedTokens: 240, savingsPercent: 72.7, costAvoidance: '$0.0031/call' },
  { archetype: 'Code & Refactor', name: 'Code & Refactor', baselineTokens: 1250, routedTokens: 420, savingsPercent: 66.4, costAvoidance: '$0.0048/call' },
  { archetype: 'Multi-Step Reasoning', name: 'Reasoning Analysis', baselineTokens: 2400, routedTokens: 920, savingsPercent: 61.7, costAvoidance: '$0.0084/call' },
  { archetype: 'Domain Synthesis', name: 'Domain Synthesis', baselineTokens: 8500, routedTokens: 4100, savingsPercent: 51.8, costAvoidance: '$0.0240/call' },
  { archetype: 'Deep Research Agentic', name: 'Deep Research', baselineTokens: 14500, routedTokens: 8800, savingsPercent: 39.3, costAvoidance: '$0.0380/call' },
];

// Custom Tooltip Formatter for Recharts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-slate-950/95 border border-white/20 rounded-xl shadow-2xl backdrop-blur-xl text-xs font-mono space-y-1 z-50">
        <div className="text-slate-300 font-bold border-b border-white/10 pb-1 flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="text-amber-400 font-semibold">WhyOr Real-time</span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400">{entry.name}:</span>
            </div>
            <span className="font-bold text-white">
              {typeof entry.value === 'number'
                ? entry.value >= 1000
                  ? `${(entry.value / 1000).toFixed(1)}k`
                  : entry.value < 1 && entry.value > 0
                  ? `$${entry.value.toFixed(3)}`
                  : entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const SavingsAnalyticsDashboard: React.FC<SavingsAnalyticsDashboardProps> = ({
  activePersona,
  onNavigateTab,
  onPrefillPrompt,
}) => {
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'q3'>('24h');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [liveTimeline, setLiveTimeline] = useState(INITIAL_TIMELINE_DATA);
  const [savingsSliderFactor, setSavingsSliderFactor] = useState<number>(1.0);
  const [selectedChartTab, setSelectedChartTab] = useState<'tokens' | 'cost' | 'personas' | 'providers' | 'archetypes'>('tokens');

  // Simulated live updates every 3.5 seconds if streaming enabled
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setLiveTimeline((prev) => {
        const last = prev[prev.length - 1];
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const deltaMultiplier = 0.85 + Math.random() * 0.35;
        const baselineTokens = Math.round(last.baselineTokens * deltaMultiplier);
        const routedTokens = Math.round(baselineTokens * (0.31 + Math.random() * 0.08));
        const savedTokens = baselineTokens - routedTokens;
        const baselineCost = Number((baselineTokens / 1_000_000 * 3.0).toFixed(4));
        const actualCost = Number((routedTokens / 1_000_000 * 0.45).toFixed(4));
        const savingsUsd = Number((baselineCost - actualCost).toFixed(4));
        const requests = Math.round(last.requests * deltaMultiplier);

        const newPoint = {
          time: timeStr,
          baselineTokens,
          routedTokens,
          savedTokens,
          baselineCost,
          actualCost,
          savingsUsd,
          requests
        };

        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Aggregated KPI metrics based on active filter and slider
  const kpis = useMemo(() => {
    let filteredPersonas = PERSONA_USAGE_DATA;
    if (selectedPersonaFilter !== 'all') {
      filteredPersonas = PERSONA_USAGE_DATA.filter(p => p.role === selectedPersonaFilter);
    }

    const totalTokens = filteredPersonas.reduce((acc, p) => acc + p.totalTokens, 0) * savingsSliderFactor;
    const totalSavedTokens = filteredPersonas.reduce((acc, p) => acc + p.savedTokens, 0) * savingsSliderFactor;
    const totalSavedUsd = filteredPersonas.reduce((acc, p) => acc + p.savedUsd, 0) * savingsSliderFactor;
    const totalCalls = filteredPersonas.reduce((acc, p) => acc + p.totalCalls, 0) * savingsSliderFactor;
    
    const overallSavingsPercent = totalTokens > 0 ? (totalSavedTokens / (totalTokens + totalSavedTokens)) * 100 : 66.4;
    const counterfactualCostUsd = totalSavedUsd * 1.52;
    const roiMultiplier = (totalSavedUsd / (counterfactualCostUsd - totalSavedUsd || 1)).toFixed(1);

    return {
      totalTokens: Math.round(totalTokens),
      totalSavedTokens: Math.round(totalSavedTokens),
      totalSavedUsd: Number(totalSavedUsd.toFixed(2)),
      totalCalls: Math.round(totalCalls),
      overallSavingsPercent: Number(overallSavingsPercent.toFixed(1)),
      counterfactualCostUsd: Number(counterfactualCostUsd.toFixed(2)),
      roiMultiplier: Math.max(1.8, Number(roiMultiplier))
    };
  }, [selectedPersonaFilter, savingsSliderFactor]);

  const handleExportData = () => {
    const jsonStr = JSON.stringify({
      exportDate: new Date().toISOString(),
      personaFilter: selectedPersonaFilter,
      timeRange,
      kpis,
      timeline: liveTimeline,
      personaUsage: PERSONA_USAGE_DATA,
      providerShare: PROVIDER_SHARE_DATA,
      archetypes: ARCHETYPE_EFFICIENCY_DATA
    }, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whyor-dispatch-savings-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Top Header & Filter Controls */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/15 shadow-2xl backdrop-blur-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Token Savings & Usage Analytics</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time counterfactual savings analysis comparing WhyOr dynamic routing vs uniform frontier model execution.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Persona Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Persona:</span>
            <select
              id="persona-analytics-filter"
              value={selectedPersonaFilter}
              onChange={(e) => setSelectedPersonaFilter(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Personas (Multi-Tenant)</option>
              <option value="guest" className="bg-slate-900">Guest (Anonymous)</option>
              <option value="user" className="bg-slate-900">Pro Developer (Alex)</option>
              <option value="team_member" className="bg-slate-900">Team Member (Sarah)</option>
              <option value="team_admin" className="bg-slate-900">Team Admin (Acme AI)</option>
              <option value="platform_admin" className="bg-slate-900">Platform Admin (Elena)</option>
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-mono">
            {(['24h', '7d', '30d', 'q3'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Live Streaming Toggle */}
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all border cursor-pointer ${
              isLiveStreaming
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Toggle real-time telemetry stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveStreaming ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isLiveStreaming ? 'Live' : 'Paused'}</span>
          </button>

          {/* Export Report */}
          <button
            id="export-analytics-report-btn"
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-mono font-medium transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Tokens Saved */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-900/80 border border-emerald-400/30 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-emerald-300 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Tokens Economized
            </span>
            <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/20">
              +{kpis.overallSavingsPercent}% Eff.
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            {(kpis.totalSavedTokens / 1_000_000).toFixed(1)}M
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Saved from a total {((kpis.totalTokens + kpis.totalSavedTokens) / 1_000_000).toFixed(1)}M requested tokens.
          </p>
        </div>

        {/* Metric 2: Net Dollars Saved */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-900/60 to-slate-900/80 border border-cyan-400/30 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-cyan-400" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Direct Cost Avoidance
            </span>
            <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/20">
              Net Avoided
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 tracking-tight font-display">
            ${kpis.totalSavedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Counterfactual baseline spend would be ${kpis.counterfactualCostUsd.toLocaleString()}.
          </p>
        </div>

        {/* Metric 3: Multi-Model Latency Budget */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-900/80 border border-amber-400/30 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-16 h-16 text-amber-400" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-amber-300 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Avg Routing Latency
            </span>
            <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/20">
              -76% Fast
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight font-display">
            218ms
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Versus 920ms average on full frontier multi-step models.
          </p>
        </div>

        {/* Metric 4: Multi-Tenant Calls Dispatched */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-900/60 to-slate-900/80 border border-purple-400/30 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers className="w-16 h-16 text-purple-400" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-purple-300 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Total Dispatches
            </span>
            <span className="text-[10px] font-mono text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/20">
              {kpis.roiMultiplier}x ROI
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 tracking-tight font-display">
            {kpis.totalCalls.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Processed across 5 persona permission tiers.
          </p>
        </div>

      </div>

      {/* Chart Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedChartTab('tokens')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedChartTab === 'tokens'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Token Savings Velocity</span>
          </button>

          <button
            onClick={() => setSelectedChartTab('cost')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedChartTab === 'cost'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cost Trajectory ($ USD)</span>
          </button>

          <button
            onClick={() => setSelectedChartTab('personas')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedChartTab === 'personas'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Persona Tier Matrix</span>
          </button>

          <button
            onClick={() => setSelectedChartTab('providers')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedChartTab === 'providers'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Provider Share</span>
          </button>

          <button
            onClick={() => setSelectedChartTab('archetypes')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedChartTab === 'archetypes'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>7-Archetype Breakdown</span>
          </button>
        </div>

        {/* Dynamic Multiplier Scale Knob */}
        <div className="flex items-center gap-2 text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Scale Simulator:</span>
          <span className="text-cyan-300 font-bold">{savingsSliderFactor.toFixed(1)}x</span>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.5"
            value={savingsSliderFactor}
            onChange={(e) => setSavingsSliderFactor(parseFloat(e.target.value))}
            className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* Main Chart Visualization Box */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-4">
        
        {/* TAB 1: Token Velocity AreaChart */}
        {selectedChartTab === 'tokens' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Token Consumption vs Counterfactual Frontier Baseline
                </h3>
                <p className="text-xs text-slate-400">
                  Green area represents Net Token Savings gained via 2-stage classification & context ledger rehydration.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-3 h-3 rounded-sm bg-rose-500/80" /> Baseline Frontier Tokens
                </span>
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <span className="w-3 h-3 rounded-sm bg-emerald-400" /> WhyOr Routed Tokens
                </span>
              </div>
            </div>

            <div className="h-[340px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.rose} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={COLORS.rose} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorRouted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.7} />
                      <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.5} />
                      <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val / 1000}k`} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="baselineTokens"
                    name="Frontier Baseline"
                    stroke={COLORS.rose}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBaseline)"
                  />
                  <Area
                    type="monotone"
                    dataKey="savedTokens"
                    name="Net Token Savings"
                    stroke={COLORS.cyan}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSaved)"
                  />
                  <Area
                    type="monotone"
                    dataKey="routedTokens"
                    name="Actual Routed Tokens"
                    stroke={COLORS.emerald}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRouted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: Cost Trajectory LineChart */}
        {selectedChartTab === 'cost' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                  Real-time Dollar Spend & Cumulative Cost Avoidance ($ USD)
                </h3>
                <p className="text-xs text-slate-400">
                  Divergence curve showing actual WhyOr multi-tier expenditure vs uniform frontier model billing.
                </p>
              </div>
            </div>

            <div className="h-[340px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={liveTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="baselineCost"
                    name="Counterfactual Frontier Cost ($)"
                    stroke={COLORS.rose}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: COLORS.rose }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="savingsUsd"
                    name="Net Savings Avoided ($)"
                    stroke={COLORS.cyan}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: COLORS.cyan }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualCost"
                    name="WhyOr Actual Dispatched Cost ($)"
                    stroke={COLORS.emerald}
                    strokeWidth={3}
                    dot={{ r: 4, fill: COLORS.emerald }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3: Persona Tier Breakdown BarChart */}
        {selectedChartTab === 'personas' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Model Tier Distribution by Tenant Persona (RBAC Governance)
                </h3>
                <p className="text-xs text-slate-400">
                  Visualizes how tier caps and permissions ensure cost efficiency across guest, developer, and team roles.
                </p>
              </div>
            </div>

            <div className="h-[340px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PERSONA_USAGE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="personaName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val}%`} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Bar dataKey="lowTier" name="Low Tier (Gemini Flash / DeepSeek)" stackId="a" fill={TIER_COLORS.low} />
                  <Bar dataKey="midTier" name="Mid Tier (Hybrid Thinking / Haiku)" stackId="a" fill={TIER_COLORS.mid} />
                  <Bar dataKey="highTier" name="High Tier (Sonnet / GPT-4o)" stackId="a" fill={TIER_COLORS.high} />
                  <Bar dataKey="frontierTier" name="Frontier Tier (Gemini Pro / o3-mini)" stackId="a" fill={TIER_COLORS.frontier} />
                  <Bar dataKey="deepReasoningTier" name="Deep Reasoning (Opus / R1)" stackId="a" fill={TIER_COLORS.deep_reasoning} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 4: Provider Share PieChart */}
        {selectedChartTab === 'providers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-purple-400" />
                  Provider Routing Volume & Capital Allocation
                </h3>
                <p className="text-xs text-slate-400">
                  Distribution of routed tokens across Google Gemini, Anthropic, DeepSeek, OpenAI, Mistral, and Groq.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 pt-4">
              <div className="md:col-span-6 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PROVIDER_SHARE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="tokens"
                      nameKey="name"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {PROVIDER_SHARE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PROVIDER_COLORS[entry.provider] || COLORS.slate} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="md:col-span-6 space-y-2.5 font-mono text-xs">
                {PROVIDER_SHARE_DATA.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between hover:bg-white/[0.06] transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[p.provider] }} />
                      <span className="font-semibold text-white">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">{(p.tokens / 1_000_000).toFixed(1)}M tokens</span>
                      <span className="font-bold text-cyan-300">{p.percent}%</span>
                      <span className="text-emerald-400 font-semibold">${p.costUsd.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: 7-Archetype Breakdown BarChart */}
        {selectedChartTab === 'archetypes' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Token Optimization Efficiency by 7-Task Taxonomy
                </h3>
                <p className="text-xs text-slate-400">
                  Comparing token savings percentages gained across each semantic archetype.
                </p>
              </div>
            </div>

            <div className="h-[340px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ARCHETYPE_EFFICIENCY_DATA} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="savingsPercent" name="Token Savings %" fill={COLORS.emerald} radius={[0, 6, 6, 0]}>
                    {ARCHETYPE_EFFICIENCY_DATA.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.savingsPercent > 75 ? COLORS.emerald : entry.savingsPercent > 60 ? COLORS.cyan : COLORS.amber}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {/* Interactive Persona Deep-Dive Data Table */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Tenant Persona Governance & Spend Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Live breakdown of quota utilization, tier allocation, and net dollar savings generated per tenant role.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Active Persona: <span className="text-amber-300 font-bold">{activePersona.name} ({activePersona.role})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 pr-4">Persona Profile</th>
                <th className="pb-3 pr-4">RBAC Role</th>
                <th className="pb-3 pr-4">Total Calls</th>
                <th className="pb-3 pr-4">Tokens Dispatched</th>
                <th className="pb-3 pr-4">Tokens Saved</th>
                <th className="pb-3 pr-4">Net Savings ($)</th>
                <th className="pb-3 pr-4">Efficiency</th>
                <th className="pb-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {PERSONA_USAGE_DATA.map((row, idx) => {
                const isCurrentActive = row.role === activePersona.role;

                return (
                  <tr
                    key={idx}
                    className={`transition-colors hover:bg-white/[0.04] ${
                      isCurrentActive ? 'bg-amber-500/10 font-medium' : ''
                    }`}
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-white font-semibold">{row.personaName}</span>
                        {isCurrentActive && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-slate-300">
                        {row.role}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-300">{row.totalCalls.toLocaleString()}</td>
                    <td className="py-3.5 pr-4 text-slate-300">{(row.totalTokens / 1_000_000).toFixed(1)}M</td>
                    <td className="py-3.5 pr-4 text-emerald-400 font-bold">{(row.savedTokens / 1_000_000).toFixed(1)}M</td>
                    <td className="py-3.5 pr-4 text-cyan-300 font-bold">${row.savedUsd.toLocaleString()}</td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full rounded-full" style={{ width: `${row.avgSavingsPercent}%` }} />
                        </div>
                        <span className="text-[11px] text-emerald-300 font-bold">{row.avgSavingsPercent}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      {onNavigateTab && (
                        <button
                          onClick={() => {
                            if (onPrefillPrompt) {
                              onPrefillPrompt(`Benchmark token efficiency test for ${row.personaName}`);
                            }
                            onNavigateTab('dispatch');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Test Dispatch</span>
                          <ChevronRight className="w-3 h-3 text-cyan-400" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
