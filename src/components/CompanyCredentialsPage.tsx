import React, { useState, useEffect } from 'react';
import { 
  Key, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Send, 
  Cpu, 
  Zap, 
  Building, 
  Lock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  ExternalLink, 
  Layers, 
  Settings, 
  Sliders, 
  Globe, 
  Activity, 
  Sparkles, 
  Database, 
  Save, 
  ArrowRight,
  Info,
  Server,
  CloudLightning,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AIProvider, CompanyProviderCredential, CompanyOnboardingProfile } from '../types';

interface ProviderConfigMeta {
  id: AIProvider;
  name: string;
  category: 'Frontier Reasoning' | 'High-Speed LPU' | 'Open Weights' | 'Enterprise / Custom';
  logoColor: string;
  defaultBaseUrl?: string;
  supportedModels: { id: string; name: string; tier: string }[];
  keyPlaceholder: string;
  keyPrefix: string;
  docsUrl: string;
  pricingNote: string;
}

const PROVIDER_METAS: ProviderConfigMeta[] = [
  {
    id: 'google',
    name: 'Google Gemini',
    category: 'Frontier Reasoning',
    logoColor: 'from-blue-500 to-cyan-400',
    supportedModels: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'Low / Fast' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'Frontier' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tier: 'Low / Real-Time' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tier: 'Frontier Long-Context' },
    ],
    keyPlaceholder: 'AIzaSy...',
    keyPrefix: 'AIzaSy',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    pricingNote: '$0.10 / $0.40 per 1M tokens (Direct Google Cloud Billing)',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'Frontier Reasoning',
    logoColor: 'from-emerald-500 to-teal-400',
    supportedModels: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni)', tier: 'Frontier' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tier: 'Low Cost' },
      { id: 'o1', name: 'o1 Reasoning', tier: 'Deep Reasoning' },
      { id: 'o3-mini', name: 'o3-mini Fast Reasoning', tier: 'High Speed Reasoning' },
      { id: 'gpt-4.5-preview', name: 'GPT-4.5 Research', tier: 'Frontier Max' },
    ],
    keyPlaceholder: 'sk-proj-... or sk-...',
    keyPrefix: 'sk-',
    docsUrl: 'https://platform.openai.com/api-keys',
    pricingNote: '$0.15 / $0.60 per 1M tokens on 4o-mini (Direct OpenAI Billing)',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    category: 'Frontier Reasoning',
    logoColor: 'from-amber-500 to-orange-400',
    supportedModels: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid CoT)', tier: 'Frontier Hybrid' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', tier: 'Frontier Coding' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', tier: 'Low Latency' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', tier: 'Frontier Deep Synthesis' },
    ],
    keyPlaceholder: 'sk-ant-api03-...',
    keyPrefix: 'sk-ant-',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    pricingNote: '$0.80 / $4.00 on Haiku, $3.00 / $15.00 on Sonnet',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    category: 'Frontier Reasoning',
    logoColor: 'from-blue-600 to-indigo-500',
    defaultBaseUrl: 'https://api.deepseek.com',
    supportedModels: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (671B MoE)', tier: 'Ultra-Low Cost' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (CoT Proofs)', tier: 'Deep Reasoning' },
    ],
    keyPlaceholder: 'sk-...',
    keyPrefix: 'sk-',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    pricingNote: '$0.14 / $0.28 per 1M tokens (Direct DeepSeek Billing)',
  },
  {
    id: 'groq',
    name: 'Groq LPU (Ultra-Low Latency)',
    category: 'High-Speed LPU',
    logoColor: 'from-orange-500 to-red-500',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    supportedModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (380 tok/s)', tier: 'Mid Tier LPU' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (750 tok/s)', tier: 'Ultra-Fast LPU' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k context)', tier: 'Mid MoE' },
    ],
    keyPlaceholder: 'gsk_...',
    keyPrefix: 'gsk_',
    docsUrl: 'https://console.groq.com/keys',
    pricingNote: '$0.05 / $0.08 per 1M tokens on 8B (<90ms latency)',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    category: 'Open Weights',
    logoColor: 'from-amber-400 to-yellow-500',
    supportedModels: [
      { id: 'mistral-large-latest', name: 'Mistral Large 2', tier: 'Frontier EU' },
      { id: 'codestral-latest', name: 'Codestral (AST Specialist)', tier: 'Code Gen' },
      { id: 'pixtral-12b-2409', name: 'Pixtral Vision 12B', tier: 'Multimodal' },
    ],
    keyPlaceholder: 'sk-... or ...',
    keyPrefix: '',
    docsUrl: 'https://console.mistral.ai/api-keys/',
    pricingNote: 'European data-sovereign enterprise models',
  },
  {
    id: 'custom',
    name: 'Self-Hosted / Azure / vLLM Endpoint',
    category: 'Enterprise / Custom',
    logoColor: 'from-purple-500 to-pink-500',
    defaultBaseUrl: 'http://localhost:11434/v1',
    supportedModels: [
      { id: 'custom-vllm-model', name: 'Private vLLM / Ollama Node', tier: 'Private VPC' },
      { id: 'azure-openai-deployment', name: 'Azure OpenAI Private Gateway', tier: 'Enterprise VPC' },
    ],
    keyPlaceholder: 'Bearer token or custom API key...',
    keyPrefix: '',
    docsUrl: 'https://docs.vllm.ai',
    pricingNote: 'Zero token cost (Host compute only)',
  },
];

interface CompanyCredentialsPageProps {
  onNavigateToDispatch?: (prefilledPrompt?: string, modelId?: string) => void;
}

export const CompanyCredentialsPage: React.FC<CompanyCredentialsPageProps> = ({ onNavigateToDispatch }) => {
  const [profile, setProfile] = useState<CompanyOnboardingProfile>({
    companyName: 'Acme Enterprises AI Lab',
    orgId: 'org_enterprise_8892',
    primaryContactEmail: 'ai-ops@acme.com',
    byokMode: 'direct_keys_only',
    credentials: {},
    lastUpdated: new Date().toISOString(),
  });

  const [credentials, setCredentials] = useState<Record<string, CompanyProviderCredential>>({});
  const [rawKeyInputs, setRawKeyInputs] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [expandedSettings, setExpandedSettings] = useState<Record<string, boolean>>({});
  const [verifyLoading, setVerifyLoading] = useState<Record<string, boolean>>({});
  const [verifyStatus, setVerifyStatus] = useState<Record<string, { success: boolean; message: string; latencyMs?: number; detectedModels?: string[] }>>({});
  
  // Direct Live AI Sandbox Test State
  const [testProvider, setTestProvider] = useState<string>('google');
  const [testModelId, setTestModelId] = useState<string>('gemini-2.5-flash');
  const [testPrompt, setTestPrompt] = useState<string>('Perform a direct live health check. Report your internal model ID, compute latency, and confirm direct company billing routing.');
  const [testExecuting, setTestExecuting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Fetch initial profile & credentials from server
  useEffect(() => {
    fetchCredentials();
    fetchProfile();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await fetch('/api/credentials');
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
      }
    } catch (err) {
      console.error('Failed to load company credentials from server', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/credentials/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to load company profile', err);
    }
  };

  const handleSaveProfile = async (updatedByokMode?: 'direct_keys_only' | 'hybrid_fallback' | 'platform_pool') => {
    const newProfile = {
      ...profile,
      byokMode: updatedByokMode || profile.byokMode,
    };
    setProfile(newProfile);
    try {
      await fetch('/api/credentials/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      });
      showNotification('Company routing policy updated successfully.');
    } catch (err) {
      console.error('Failed to update company profile', err);
    }
  };

  const handleSaveCredential = async (provider: AIProvider) => {
    const rawKey = rawKeyInputs[provider];
    const existing = credentials[provider];
    const meta = PROVIDER_METAS.find(m => m.id === provider);

    try {
      const res = await fetch('/api/credentials/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          providerDisplayName: meta?.name || provider,
          apiKey: rawKey || undefined,
          baseUrl: existing?.baseUrl,
          organizationId: existing?.organizationId,
          projectId: existing?.projectId,
          monthlySpendLimitUsd: existing?.monthlySpendLimitUsd || 5000,
          notes: existing?.notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCredentials(prev => ({
          ...prev,
          [provider]: data.credential,
        }));
        setRawKeyInputs(prev => ({ ...prev, [provider]: '' }));
        showNotification(`API Key for ${meta?.name || provider} saved to Company Key Vault.`);
      }
    } catch (err: any) {
      console.error('Failed to save credential', err);
    }
  };

  const handleVerifyDirectKey = async (provider: AIProvider) => {
    setVerifyLoading(prev => ({ ...prev, [provider]: true }));
    setVerifyStatus(prev => ({ ...prev, [provider]: { success: false, message: 'Initiating direct live handshake...' } }));

    const rawKey = rawKeyInputs[provider];
    const existing = credentials[provider];

    try {
      const res = await fetch('/api/credentials/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: rawKey || undefined,
          baseUrl: existing?.baseUrl,
          organizationId: existing?.organizationId,
          projectId: existing?.projectId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVerifyStatus(prev => ({
          ...prev,
          [provider]: {
            success: true,
            message: `Direct Live Ping Succeeded (${data.latencyMs}ms)`,
            latencyMs: data.latencyMs,
            detectedModels: data.detectedModels,
          }
        }));
        fetchCredentials();
      } else {
        setVerifyStatus(prev => ({
          ...prev,
          [provider]: {
            success: false,
            message: data.error || 'Direct authentication rejected by provider',
          }
        }));
      }
    } catch (err: any) {
      setVerifyStatus(prev => ({
        ...prev,
        [provider]: {
          success: false,
          message: err.message || 'Network error verifying key',
        }
      }));
    } finally {
      setVerifyLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleDeleteCredential = async (provider: AIProvider) => {
    if (!confirm(`Are you sure you want to remove the direct API key for ${provider.toUpperCase()}?`)) return;
    try {
      const res = await fetch('/api/credentials/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) {
        fetchCredentials();
        setRawKeyInputs(prev => ({ ...prev, [provider]: '' }));
        setVerifyStatus(prev => ({ ...prev, [provider]: { success: false, message: 'Key removed' } }));
        showNotification(`API Key for ${provider} removed from vault.`);
      }
    } catch (err) {
      console.error('Failed to delete credential', err);
    }
  };

  const handleExecuteDirectSandbox = async () => {
    if (!testPrompt.trim()) return;
    setTestExecuting(true);
    setTestError(null);
    setTestResult(null);

    const cred = credentials[testProvider];
    const rawKey = rawKeyInputs[testProvider];

    try {
      const res = await fetch('/api/credentials/direct-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: testProvider,
          modelId: testModelId,
          prompt: testPrompt,
          apiKey: rawKey || undefined,
          baseUrl: cred?.baseUrl,
          organizationId: cred?.organizationId,
          projectId: cred?.projectId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(data);
      } else {
        setTestError(data.error || 'Direct model call failed');
      }
    } catch (err: any) {
      setTestError(err.message || 'Direct sandbox execution failed');
    } finally {
      setTestExecuting(false);
    }
  };

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const totalConnected = (Object.values(credentials) as CompanyProviderCredential[]).filter(c => c?.status === 'connected' || Boolean(c?.hasKey)).length;
  const totalAvailableProviders = PROVIDER_METAS.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-sm shadow-xl shadow-black/40 backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Header & Onboarding Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-white/[0.1] p-6 lg:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-400/30 text-xs font-mono font-medium">
                <Building className="w-3.5 h-3.5 text-orange-400" />
                Company Onboarding & BYOK
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Zero Platform Token Markup
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-tight">
              Company AI Engine Credentials & Direct Provider Connection
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Onboard your organization's direct API keys and enterprise subscriptions (Google, OpenAI, Anthropic, DeepSeek, Groq, Mistral, etc.). When dispatches occur, WhyOr executes requests directly through your accounts—giving you 100% direct provider token economics with zero intermediate platform token fees.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white/[0.04] p-4 rounded-xl border border-white/[0.08] backdrop-blur-md">
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-2xl font-bold font-mono text-emerald-400">{totalConnected} / {totalAvailableProviders}</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Engines Active</div>
            </div>
            <div className="text-center px-3 border-r border-white/10">
              <div className="text-2xl font-bold font-mono text-cyan-400">~185ms</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Direct Ping</div>
            </div>
            <div className="text-center px-3">
              <div className="text-2xl font-bold font-mono text-amber-400">$0.00</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Platform Token Fee</div>
            </div>
          </div>
        </div>

        {/* Company Profile & Global Routing Policy Setting */}
        <div className="mt-8 pt-6 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <label className="block text-[11px] font-mono text-slate-400 uppercase">Onboarded Organization</label>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-white font-medium text-sm">{profile.companyName}</span>
              <span className="text-[11px] font-mono text-slate-500">{profile.orgId}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <label className="block text-[11px] font-mono text-slate-400 uppercase">Vault Security Status</label>
            <div className="mt-1 flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>AES-256 In-Memory & Direct Ephemeral Dispatch</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <label className="block text-[11px] font-mono text-slate-400 uppercase">Active Dispatch Billing Mode</label>
            <div className="mt-1.5 flex items-center gap-2">
              <select 
                value={profile.byokMode}
                onChange={(e) => handleSaveProfile(e.target.value as any)}
                className="w-full bg-slate-950 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-400"
              >
                <option value="direct_keys_only">⚡ Direct Company Keys (100% BYOK)</option>
                <option value="hybrid_fallback">🛡️ Hybrid Auto-Fallback (Direct + Platform Pool)</option>
                <option value="platform_pool">🏢 Platform Token Pool</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Matrix Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              AI Engine API Keys & Connection Matrix
            </h2>
            <p className="text-xs text-slate-400">Configure real provider credentials to route directly through your organization's API accounts.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchCredentials();
                showNotification('Refreshed connection status for all providers.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-medium border border-white/10 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              Refresh Status
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROVIDER_METAS.map((meta) => {
            const cred = credentials[meta.id];
            const isConnected = cred?.status === 'connected' || Boolean(cred?.hasKey);
            const isVerifying = verifyLoading[meta.id];
            const currentVerify = verifyStatus[meta.id];
            const isExpanded = expandedSettings[meta.id];

            return (
              <div 
                key={meta.id}
                id={`provider-card-${meta.id}`}
                className={`relative rounded-xl border p-5 transition-all duration-200 ${
                  isConnected 
                    ? 'bg-slate-900/80 border-emerald-500/30 shadow-lg shadow-black/20' 
                    : 'bg-slate-900/40 border-white/[0.08] hover:border-white/20'
                }`}
              >
                {/* Top Row: Provider Brand & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.logoColor} flex items-center justify-center text-white shadow-md font-bold text-sm font-mono`}>
                      {meta.id === 'google' ? 'G' : meta.id === 'openai' ? 'OA' : meta.id === 'anthropic' ? 'AN' : meta.id === 'deepseek' ? 'DS' : meta.id === 'groq' ? 'GQ' : meta.id === 'mistral' ? 'MS' : 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-sm tracking-tight">{meta.name}</h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">
                          {meta.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {meta.pricingNote}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isConnected ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-mono font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Connected & Direct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-white/10 text-[11px] font-mono">
                        Unconfigured
                      </span>
                    )}
                  </div>
                </div>

                {/* API Key Input & Action Row */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Direct Provider API Key:</span>
                    <a 
                      href={meta.docsUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                    >
                      Get Key from Provider <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type={showKeys[meta.id] ? 'text' : 'password'}
                      placeholder={cred?.maskedKey ? `Current Key: ${cred.maskedKey}` : meta.keyPlaceholder}
                      value={rawKeyInputs[meta.id] || ''}
                      onChange={(e) => setRawKeyInputs({ ...rawKeyInputs, [meta.id]: e.target.value })}
                      className="w-full bg-slate-950/80 border border-white/15 focus:border-orange-400 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition-all pr-24"
                    />

                    <div className="absolute right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowKeys({ ...showKeys, [meta.id]: !showKeys[meta.id] })}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                        title={showKeys[meta.id] ? 'Hide Key' : 'Show Key'}
                      >
                        {showKeys[meta.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      {cred?.maskedKey && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(cred.maskedKey, meta.id)}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Copy masked key identifier"
                        >
                          {copiedKey === meta.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verification result feedback */}
                {currentVerify && (
                  <div className={`mt-2.5 p-2.5 rounded-lg text-xs font-mono flex items-center justify-between ${
                    currentVerify.success 
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300' 
                      : 'bg-red-950/40 border border-red-500/30 text-red-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {currentVerify.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                      <span className="truncate max-w-[280px]">{currentVerify.message}</span>
                    </div>
                    {currentVerify.latencyMs && (
                      <span className="text-cyan-400 font-bold">{currentVerify.latencyMs}ms</span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isVerifying}
                      onClick={() => handleVerifyDirectKey(meta.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Testing Live Ping...
                        </>
                      ) : (
                        <>
                          <Activity className="w-3 h-3 text-cyan-400" />
                          Live Handshake Ping
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveCredential(meta.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30 text-xs font-medium transition-all cursor-pointer"
                    >
                      <Save className="w-3 h-3 text-orange-400" />
                      Save Key
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSettings({ ...expandedSettings, [meta.id]: !isExpanded })}
                      className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 font-mono cursor-pointer"
                    >
                      <span>Options</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isConnected && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCredential(meta.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove credential from vault"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Advanced Options Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-3 text-xs animate-fade-in">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 uppercase">Custom Base URL (Proxy / Azure / Private VPC):</label>
                      <input
                        type="text"
                        placeholder={meta.defaultBaseUrl || 'https://api.provider.com/v1'}
                        value={cred?.baseUrl || ''}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          [meta.id]: { ...(cred || { provider: meta.id, providerDisplayName: meta.name, apiKey: '', maskedKey: '', status: 'unconfigured' }), baseUrl: e.target.value }
                        })}
                        className="mt-1 w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-mono text-slate-400 uppercase">Organization ID:</label>
                        <input
                          type="text"
                          placeholder="org-..."
                          value={cred?.organizationId || ''}
                          onChange={(e) => setCredentials({
                            ...credentials,
                            [meta.id]: { ...(cred || { provider: meta.id, providerDisplayName: meta.name, apiKey: '', maskedKey: '', status: 'unconfigured' }), organizationId: e.target.value }
                          })}
                          className="mt-1 w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-slate-400 uppercase">Monthly Budget Alert ($):</label>
                        <input
                          type="number"
                          placeholder="5000"
                          value={cred?.monthlySpendLimitUsd || 5000}
                          onChange={(e) => setCredentials({
                            ...credentials,
                            [meta.id]: { ...(cred || { provider: meta.id, providerDisplayName: meta.name, apiKey: '', maskedKey: '', status: 'unconfigured' }), monthlySpendLimitUsd: Number(e.target.value) }
                          })}
                          className="mt-1 w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Supported Models Badges */}
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Directly Accessible Models:</label>
                      <div className="flex flex-wrap gap-1.5">
                        {meta.supportedModels.map(mod => (
                          <span key={mod.id} className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/10 text-[10px] font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {mod.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Live Direct AI Engine Test Sandbox */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-white/[0.1] p-6 lg:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-400/30">
                <CloudLightning className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-white font-display">
                Direct AI Engine Live Test Sandbox
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify actual real-time inference execution, response text, token usage, and latency directly against your company's credentials (no simulated mock data).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToDispatch && (
              <button
                type="button"
                onClick={() => onNavigateToDispatch()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                <span>Go to Dispatch Console with Direct Keys</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sandbox Controls Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Target Provider Engine:</label>
            <select
              value={testProvider}
              onChange={(e) => {
                const p = e.target.value;
                setTestProvider(p);
                const meta = PROVIDER_METAS.find(m => m.id === p);
                if (meta && meta.supportedModels.length > 0) {
                  setTestModelId(meta.supportedModels[0].id);
                }
              }}
              className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-orange-400"
            >
              {PROVIDER_METAS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {credentials[m.id]?.hasKey ? '✓ (Direct Key Configured)' : '(Using Fallback)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Direct Model ID:</label>
            <select
              value={testModelId}
              onChange={(e) => setTestModelId(e.target.value)}
              className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            >
              {PROVIDER_METAS.find(m => m.id === testProvider)?.supportedModels.map(mod => (
                <option key={mod.id} value={mod.id}>
                  {mod.name} ({mod.tier})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-1.5">Sample Query Preset:</label>
            <select
              onChange={(e) => setTestPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
            >
              <option value="Perform a direct live health check. Report your internal model ID, compute latency, and confirm direct company billing routing.">Direct Health & Latency Ping</option>
              <option value="Analyze token consumption economics for a 50M token batch processing pipeline. Compare frontier vs high-speed LPU routing.">Token Economics Synthesis</option>
              <option value="Write a production TypeScript distributed worker with exponential backoff and SHA-256 state tracking.">AST Code Generation Proof</option>
              <option value="Explain how context entity extraction prevents replay overhead across multi-turn LLM pipelines.">Context Ledger Analysis</option>
            </select>
          </div>
        </div>

        {/* Prompt Input & Execution */}
        <div className="space-y-3">
          <label className="block text-xs font-mono text-slate-400 uppercase">Live Prompt to AI Engine:</label>
          <div className="relative">
            <textarea
              rows={3}
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="w-full bg-slate-950/90 border border-white/20 focus:border-orange-400 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none transition-all"
              placeholder="Enter your prompt for direct execution..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Executes live direct HTTP payload with company credentials. Zero dummy mock tokens.</span>
            </div>

            <button
              type="button"
              disabled={testExecuting}
              onClick={handleExecuteDirectSandbox}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {testExecuting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Executing Direct Model Call...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Execute Direct Call via Company Key
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real Live Sandbox Output */}
        {testError && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs space-y-1">
            <div className="font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              Direct Provider Execution Error
            </div>
            <p className="font-mono text-red-300">{testError}</p>
            <p className="text-slate-400 text-[11px]">Make sure your API key for {testProvider.toUpperCase()} is valid and active.</p>
          </div>
        )}

        {testResult && (
          <div className="rounded-xl bg-slate-950 border border-white/20 p-5 space-y-4 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-bold text-xs font-mono uppercase">Direct Provider 200 OK</span>
                <span className="text-slate-400 text-xs font-mono">[{testResult.provider?.toUpperCase()} / {testResult.model}]</span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">Latency: <strong className="text-cyan-400">{testResult.latencyMs}ms</strong></span>
                <span className="text-slate-400">Tokens: <strong className="text-amber-400">{testResult.inputTokens} in / {testResult.outputTokens} out</strong></span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px]">
                  Direct Company Billed
                </span>
              </div>
            </div>

            {/* Generated Content Box */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-slate-400 uppercase block">Live Model Response Output:</label>
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.08] text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                {testResult.text}
              </div>
            </div>

            {/* Direct Billing Verification Statement */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06] font-mono">
              <span>Billed To: <strong className="text-white">{testResult.billedTo}</strong></span>
              <span className="text-cyan-400">Verified Direct Handshake: {testResult.timestamp}</span>
            </div>
          </div>
        )}
      </div>

      {/* Enterprise Key Governance & Security Guarantee */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Zero-Retention Key Vault</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            API keys are handled ephemerally in memory or injected into server-side HTTPS requests without being stored in persistent plain text or leaked to the client browser.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Direct Provider Economics</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Take full advantage of your enterprise volume discounts, reserved throughput capacity, and committed spend directly with Google, OpenAI, Anthropic, and Groq.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Cryptographic Ledger Audit</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Every dispatch executed via direct company keys creates a SHA-256 verifiable audit block recording the provider account, token count, and entity ledger entry.
          </p>
        </div>
      </div>

    </div>
  );
};
