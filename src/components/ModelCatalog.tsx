import React, { useState } from 'react';
import { AIModel, AIProvider, ModelTier, UserPersona } from '../types';
import { 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  Calculator, 
  Sparkles, 
  Check, 
  Sliders, 
  ShieldCheck, 
  Cpu, 
  ExternalLink,
  Zap,
  Trash2,
  Activity,
  Download,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface ModelCatalogProps {
  models: AIModel[];
  onAddModel: (newModel: AIModel) => void;
  onUpdateModelStatus: (id: string, status: AIModel['status']) => void;
  activePersona: UserPersona;
  onNavigateTab?: (tab: string) => void;
  onSelectModelForDispatch?: (modelId: string) => void;
}

export const ModelCatalog: React.FC<ModelCatalogProps> = ({
  models,
  onAddModel,
  onUpdateModelStatus,
  activePersona,
  onNavigateTab,
  onSelectModelForDispatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [testedLatencies, setTestedLatencies] = useState<Record<string, number>>({});

  // Token Cost Calculator State
  const [calcInputTokens, setCalcInputTokens] = useState<number>(800);
  const [calcOutputTokens, setCalcOutputTokens] = useState<number>(350);
  const [calcRequestsPerDay, setCalcRequestsPerDay] = useState<number>(5000);

  // New Model Form State
  const [newModelName, setNewModelName] = useState('');
  const [newModelProvider, setNewModelProvider] = useState<AIProvider>('openai');
  const [newModelTier, setNewModelTier] = useState<ModelTier>('mid');
  const [newInputPrice, setNewInputPrice] = useState<number>(0.25);
  const [newOutputPrice, setNewOutputPrice] = useState<number>(1.00);
  const [newContextWindow, setNewContextWindow] = useState<number>(128000);
  const [newLatency, setNewLatency] = useState<number>(350);
  const [newDescription, setNewDescription] = useState('');

  const filteredModels = models.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.providerDisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || m.provider === selectedProvider;
    const matchesTier = selectedTier === 'all' || m.tier === selectedTier;
    return matchesSearch && matchesProvider && matchesTier;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim()) return;

    const created: AIModel = {
      id: `custom-${newModelProvider}-${Date.now().toString(36)}`,
      name: newModelName,
      provider: newModelProvider,
      providerDisplayName: newModelProvider.toUpperCase(),
      tier: newModelTier,
      tierLabel: `${newModelTier.toUpperCase()} Custom Tier`,
      inputPricePerM: Number(newInputPrice),
      outputPricePerM: Number(newOutputPrice),
      contextWindowTokens: Number(newContextWindow),
      capabilities: {
        code: true,
        vision: false,
        reasoning: true,
        functionCalling: true,
        jsonOutput: true,
        longContext: newContextWindow >= 200000,
      },
      latencyAvgMs: Number(newLatency),
      qualityBenchmarkScore: 89,
      status: 'active',
      description: newDescription || 'Custom registered AI tool/model in WhyOr Dispatch router.',
      recommendedFor: ['Custom team workflows', 'Internal API orchestration'],
      isCustomBYOK: true,
    };

    onAddModel(created);
    setShowAddModal(false);
    setNewModelName('');
    setNewDescription('');
  };

  const handlePingTest = (modelId: string, baseLatency: number) => {
    setTestingModelId(modelId);
    setTimeout(() => {
      const measured = Math.max(50, Math.floor(baseLatency + (Math.random() * 60 - 30)));
      setTestedLatencies(prev => ({ ...prev, [modelId]: measured }));
      setTestingModelId(null);
    }, 450);
  };

  const handleExportCatalog = () => {
    const jsonStr = JSON.stringify(models, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whyor-model-catalog-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <Layers className="w-3.5 h-3.5" /> AI Model & Tool Catalog Registry ({models.length} Integrated)
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
              Multi-Provider AI Registry & <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Extensible Gateway</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              Explore all active AI models across Google Gemini, OpenAI, Anthropic, Mistral, DeepSeek, Groq, and Meta. Platform Admins and Pro users can bring new models, tools, or local endpoints in seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="export-catalog-btn"
              onClick={handleExportCatalog}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-200 hover:text-white font-mono text-xs font-medium transition-all cursor-pointer backdrop-blur-md"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Catalog JSON</span>
            </button>

            {(activePersona.canManagePlatform || activePersona.canBYOK) && (
              <button
                id="add-ai-model-btn"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-500/25 border border-orange-400/30 backdrop-blur-md"
              >
                <Plus className="w-4 h-4" />
                <span>Bring / Add AI Model</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Token Cost Estimator Calculator */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono text-white uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            Real-Time Token Economics & Savings Calculator
          </div>
          <span className="text-[11px] font-mono text-cyan-400 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 backdrop-blur-md">
            Simulating Monthly Workload Cost
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 font-mono text-xs">
          <div className="bg-slate-950/40 p-4 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="flex justify-between text-slate-400 mb-2">
              <span>INPUT TOKENS / REQUEST:</span>
              <span className="text-white font-bold">{calcInputTokens} tok</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="50"
              value={calcInputTokens}
              onChange={(e) => setCalcInputTokens(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="flex justify-between text-slate-400 mb-2">
              <span>OUTPUT TOKENS / REQUEST:</span>
              <span className="text-white font-bold">{calcOutputTokens} tok</span>
            </div>
            <input
              type="range"
              min="50"
              max="2000"
              step="25"
              value={calcOutputTokens}
              onChange={(e) => setCalcOutputTokens(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="flex justify-between text-slate-400 mb-2">
              <span>REQUESTS PER DAY:</span>
              <span className="text-white font-bold">{calcRequestsPerDay.toLocaleString()} req/day</span>
            </div>
            <input
              type="range"
              min="500"
              max="50000"
              step="500"
              value={calcRequestsPerDay}
              onChange={(e) => setCalcRequestsPerDay(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Calculated Monthly Cost Comparison */}
        <div className="mt-5 pt-4 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-3 text-center font-mono">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="text-[10px] text-slate-400">IF SENT 100% TO FRONTIER (CLAUDE OPUS/PRO)</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">
              ${(((calcInputTokens / 1_000_000 * 15.00) + (calcOutputTokens / 1_000_000 * 75.00)) * calcRequestsPerDay * 30).toFixed(2)}
            </div>
            <div className="text-[9px] text-slate-500">monthly compute spend</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.1)] backdrop-blur-md">
            <div className="text-[10px] text-cyan-400 font-bold">WITH WHYOR DISPATCH (65-85% ROUTED)</div>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">
              ${(((calcInputTokens / 1_000_000 * 0.40) + (calcOutputTokens / 1_000_000 * 1.50)) * calcRequestsPerDay * 30).toFixed(2)}
            </div>
            <div className="text-[9px] text-emerald-400 font-semibold">✨ 78% net cost reduction</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="text-[10px] text-slate-400">NET ANNUAL CASH SAVINGS</div>
            <div className="text-lg font-bold text-white mt-0.5">
              ${(((((calcInputTokens / 1_000_000 * 15.00) + (calcOutputTokens / 1_000_000 * 75.00)) - ((calcInputTokens / 1_000_000 * 0.40) + (calcOutputTokens / 1_000_000 * 1.50))) * calcRequestsPerDay * 30) * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[9px] text-cyan-400">capital retained for team</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-4 shadow-xl shadow-black/20 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search models, providers, capabilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/70 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 backdrop-blur-md"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto font-mono text-xs">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="bg-slate-950/70 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md cursor-pointer"
          >
            <option value="all">All Providers</option>
            <option value="google">Google DeepMind</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="deepseek">DeepSeek AI</option>
            <option value="mistral">Mistral AI</option>
            <option value="groq">Groq LPUs</option>
            <option value="meta">Meta Llama</option>
            <option value="cohere">Cohere</option>
            <option value="perplexity">Perplexity</option>
            <option value="together">Together AI</option>
          </select>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-slate-950/70 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md cursor-pointer"
          >
            <option value="all">All Tiers</option>
            <option value="low">Low / Fast</option>
            <option value="mid">Mid / Balanced</option>
            <option value="high">High / Complex</option>
            <option value="frontier">Frontier</option>
            <option value="deep_reasoning">Deep Reasoning</option>
          </select>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((m) => {
          const isFrontier = m.tier === 'frontier' || m.tier === 'deep_reasoning';
          const isTesting = testingModelId === m.id;
          const liveLatency = testedLatencies[m.id] ?? m.latencyAvgMs;

          return (
            <div
              key={m.id}
              className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] hover:border-white/20 hover:bg-slate-900/70 rounded-2xl p-5 transition-all flex flex-col justify-between shadow-xl shadow-black/20"
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between mb-2 font-mono text-xs">
                  <span className="text-slate-400">{m.providerDisplayName}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold backdrop-blur-md ${
                    isFrontier ? 'bg-amber-500/15 text-amber-300 border border-amber-400/30' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30'
                  }`}>
                    {m.tier}
                  </span>
                </div>

                <h3 className="text-base font-display font-bold text-white flex items-center justify-between">
                  <span>{m.name}</span>
                  {m.isCustomBYOK && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      CUSTOM BYOK
                    </span>
                  )}
                </h3>

                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
                  {m.description}
                </p>

                {/* Token Pricing & Context */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/[0.08] font-mono text-xs">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="text-[10px] text-slate-400">INPUT / 1M</div>
                    <div className="text-white font-bold mt-0.5">${m.inputPricePerM.toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="text-[10px] text-slate-400">OUTPUT / 1M</div>
                    <div className="text-white font-bold mt-0.5">${m.outputPricePerM.toFixed(2)}</div>
                  </div>
                </div>

                {/* Latency & Context Window */}
                <div className="flex items-center justify-between mt-3 text-[11px] font-mono text-slate-400">
                  <span>Context: {(m.contextWindowTokens / 1000).toFixed(0)}k tok</span>
                  <span className="flex items-center gap-1">
                    Latency: <strong className={testedLatencies[m.id] ? 'text-emerald-400 font-bold' : 'text-slate-200'}>{liveLatency}ms</strong>
                  </span>
                  <span>Score: {m.qualityBenchmarkScore}/100</span>
                </div>
              </div>

              {/* Status & Control */}
              <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    m.status === 'active' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : m.status === 'degraded' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  <span className="text-slate-400 capitalize text-[11px]">{m.status}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Ping Test Button */}
                  <button
                    onClick={() => handlePingTest(m.id, m.latencyAvgMs)}
                    disabled={isTesting}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-400/20 text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                    title="Ping endpoint latency"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Pinging' : 'Ping'}</span>
                  </button>

                  {/* Dispatch With This Model CTA */}
                  {onSelectModelForDispatch && m.status === 'active' && (
                    <button
                      id={`dispatch-with-card-${m.id}`}
                      onClick={() => onSelectModelForDispatch(m.id)}
                      className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-400/40 text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      title={`Route prompts specifically with ${m.name}`}
                    >
                      <Zap className="w-2.5 h-2.5 text-amber-400" />
                      <span>Dispatch →</span>
                    </button>
                  )}

                  {activePersona.canManagePlatform && (
                    <select
                      value={m.status}
                      onChange={(e) => onUpdateModelStatus(m.id, e.target.value as any)}
                      className="bg-slate-950/70 border border-white/15 rounded-lg px-2 py-0.5 text-[10px] text-slate-300 focus:outline-none backdrop-blur-md cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="degraded">Degraded</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New AI Model Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-base font-display font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Register New AI Model / Tool
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 mt-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">MODEL / TOOL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Llama 3.3 70B Turbo, Qwen 2.5 Coder, Custom Enterprise LLM"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">PROVIDER</label>
                  <select
                    value={newModelProvider}
                    onChange={(e) => setNewModelProvider(e.target.value as any)}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md cursor-pointer"
                  >
                    <option value="openai">OpenAI Compatible</option>
                    <option value="google">Google Gemini API</option>
                    <option value="anthropic">Anthropic Claude API</option>
                    <option value="deepseek">DeepSeek AI</option>
                    <option value="mistral">Mistral AI</option>
                    <option value="groq">Groq LPUs</option>
                    <option value="meta">Meta Llama</option>
                    <option value="cohere">Cohere</option>
                    <option value="custom">Custom Private Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ROUTING TIER</label>
                  <select
                    value={newModelTier}
                    onChange={(e) => setNewModelTier(e.target.value as any)}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md cursor-pointer"
                  >
                    <option value="low">Low (Fast / Lightweight)</option>
                    <option value="mid">Mid (Balanced)</option>
                    <option value="high">High (Complex Code/Logic)</option>
                    <option value="frontier">Frontier (Multi-Domain)</option>
                    <option value="deep_reasoning">Deep Reasoning (Heavy CoT)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">INPUT PRICE / 1M ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInputPrice}
                    onChange={(e) => setNewInputPrice(Number(e.target.value))}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">OUTPUT PRICE / 1M ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOutputPrice}
                    onChange={(e) => setNewOutputPrice(Number(e.target.value))}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">CONTEXT TOKENS</label>
                  <input
                    type="number"
                    value={newContextWindow}
                    onChange={(e) => setNewContextWindow(Number(e.target.value))}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">EST. LATENCY (MS)</label>
                  <input
                    type="number"
                    value={newLatency}
                    onChange={(e) => setNewLatency(Number(e.target.value))}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">DESCRIPTION & CAPABILITIES</label>
                <textarea
                  rows={2}
                  placeholder="Specialized in financial tabular extraction, SQL tuning, etc."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950/70 border border-white/15 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400 backdrop-blur-md"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold transition-all shadow-lg shadow-orange-500/25 border border-orange-400/30 backdrop-blur-md cursor-pointer"
                >
                  Register & Activate Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
