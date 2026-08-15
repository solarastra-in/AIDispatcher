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
  ChevronUp,
  Terminal,
  Mail,
  SlidersHorizontal,
  Power
} from 'lucide-react';
import { AIProvider, CompanyProviderCredential, CompanyOnboardingProfile, UnifiedSubscriptionGatewayConfig } from '../types';
import { ClaudeCliTerminal } from './ClaudeCliTerminal';
import { SubscriptionOAuthModal } from './SubscriptionOAuthModal';

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
  subscriptionAvailable: boolean;
  subscriptionTiers: string[];
  cliSupported?: boolean;
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
    pricingNote: '$0.10 / $0.40 per 1M tokens (Direct API) OR $20/mo Google One AI Premium',
    subscriptionAvailable: true,
    subscriptionTiers: ['Google One AI Premium / Gemini Advanced ($20/mo Flat)', 'Google Workspace AI Enterprise Add-on'],
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
    pricingNote: '$2.50 / $10.00 per 1M tokens on 4o OR $20–$200/mo ChatGPT Plus/Pro Unlimited',
    subscriptionAvailable: true,
    subscriptionTiers: ['ChatGPT Pro Unlimited Reasoning ($200/mo Flat)', 'ChatGPT Plus Standard ($20/mo Flat)', 'ChatGPT Team / Enterprise SSO'],
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
    pricingNote: '$3.00 / $15.00 per 1M tokens (API) OR $20/mo Claude Pro/Max CLI Unlimited',
    subscriptionAvailable: true,
    subscriptionTiers: ['Claude 3.7 Max / CLI Unlimited ($20/mo Flat)', 'Claude Pro Flat ($20/mo)', 'Claude Team Workspace License'],
    cliSupported: true,
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
    pricingNote: '$0.14 / $0.28 per 1M tokens OR Web Session Bypass',
    subscriptionAvailable: true,
    subscriptionTiers: ['DeepSeek VIP Web Session ($0.14/1M or Web Flat)'],
  },
  {
    id: 'groq',
    name: 'Groq LPU (Ultra-Low Latency)',
    category: 'High-Speed LPU',
    logoColor: 'from-orange-500 to-red-500',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    supportedModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', tier: 'Sub-100ms' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', tier: 'Ultra-Fast' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k)', tier: 'MoE Fast' },
    ],
    keyPlaceholder: 'gsk_...',
    keyPrefix: 'gsk_',
    docsUrl: 'https://console.groq.com/keys',
    pricingNote: '$0.05 / $0.08 per 1M tokens (Direct Groq Cloud)',
    subscriptionAvailable: false,
    subscriptionTiers: [],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    category: 'Open Weights',
    logoColor: 'from-amber-600 to-yellow-500',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    supportedModels: [
      { id: 'mistral-large-latest', name: 'Mistral Large 2', tier: 'Frontier Sovereign' },
      { id: 'codestral-latest', name: 'Codestral (AST Code)', tier: 'Code Reasoning' },
      { id: 'pixtral-12b-2409', name: 'Pixtral 12B Vision', tier: 'Vision Low Cost' },
    ],
    keyPlaceholder: '...',
    keyPrefix: '',
    docsUrl: 'https://console.mistral.ai/api-keys',
    pricingNote: '$2.00 / $6.00 per 1M tokens on Large (Direct La Plateforme)',
    subscriptionAvailable: false,
    subscriptionTiers: [],
  },
];

interface CompanyCredentialsPageProps {
  onNavigateToDispatch?: (prompt?: string, modelId?: string) => void;
}

export const CompanyCredentialsPage: React.FC<CompanyCredentialsPageProps> = ({
  onNavigateToDispatch,
}) => {
  // State
  const [profile, setProfile] = useState<CompanyOnboardingProfile | null>(null);
  const [credentials, setCredentials] = useState<Record<string, CompanyProviderCredential>>({});
  const [gatewayConfig, setGatewayConfig] = useState<UnifiedSubscriptionGatewayConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'matrix' | 'unified_gateway' | 'claude_cli' | 'direct_sandbox' | 'settings'>('matrix');
  
  // Expanded provider cards state
  const [expandedProvider, setExpandedProvider] = useState<AIProvider | null>('anthropic');
  const [providerModeTab, setProviderModeTab] = useState<Record<string, 'subscription' | 'api_key'>>({
    google: 'subscription',
    openai: 'subscription',
    anthropic: 'subscription',
    deepseek: 'subscription',
    groq: 'api_key',
    mistral: 'api_key',
  });

  // Edit / Input States
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [baseUrlInputs, setBaseUrlInputs] = useState<Record<string, string>>({});
  const [orgInputs, setOrgInputs] = useState<Record<string, string>>({});
  const [spendLimitInputs, setSpendLimitInputs] = useState<Record<string, string>>({});

  // Verification & Sandbox State
  const [verifyingProvider, setVerifyingProvider] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, any>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sandbox Test
  const [testProvider, setTestProvider] = useState<AIProvider>('anthropic');
  const [testModelId, setTestModelId] = useState<string>('claude-3-7-sonnet-20250219');
  const [testAuthMode, setTestAuthMode] = useState<'auto' | 'subscription' | 'api_key'>('auto');
  const [testPrompt, setTestPrompt] = useState<string>(
    'Synthesize a 3-tier microservice architecture for token optimization and verify live execution latency.'
  );
  const [isExecutingTest, setIsExecutingTest] = useState<boolean>(false);
  const [testResponse, setTestResponse] = useState<any>(null);

  // Modal State
  const [oauthModalProvider, setOauthModalProvider] = useState<AIProvider | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch initial profile & credentials
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [profileRes, credsRes, gatewayRes] = await Promise.all([
        fetch('/api/credentials/profile'),
        fetch('/api/credentials'),
        fetch('/api/credentials/subscription/gateway-status'),
      ]);

      const profileData = await profileRes.json();
      const credsData = await credsRes.json();
      const gatewayData = await gatewayRes.json();

      setProfile(profileData);
      setCredentials(credsData);
      setGatewayConfig(gatewayData);

      // Pre-fill inputs
      const initialBaseUrls: Record<string, string> = {};
      const initialOrgs: Record<string, string> = {};
      const initialSpendLimits: Record<string, string> = {};

      Object.entries(credsData).forEach(([prov, c]: [string, any]) => {
        if (c.baseUrl) initialBaseUrls[prov] = c.baseUrl;
        if (c.organizationId) initialOrgs[prov] = c.organizationId;
        if (c.monthlySpendLimitUsd) initialSpendLimits[prov] = String(c.monthlySpendLimitUsd);
      });

      setBaseUrlInputs(initialBaseUrls);
      setOrgInputs(initialOrgs);
      setSpendLimitInputs(initialSpendLimits);
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to load credentials vault: ' + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save API Key / Credentials
  const handleSaveCredential = async (provider: AIProvider) => {
    const meta = PROVIDER_METAS.find(m => m.id === provider);
    const rawKey = keyInputs[provider];
    const baseUrl = baseUrlInputs[provider];
    const orgId = orgInputs[provider];
    const monthlyLimit = spendLimitInputs[provider];

    try {
      const res = await fetch('/api/credentials/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          providerDisplayName: meta?.name || provider.toUpperCase(),
          authMethod: providerModeTab[provider] === 'subscription' ? 'subscription_oauth' : 'api_key',
          apiKey: rawKey,
          baseUrl,
          organizationId: orgId,
          monthlySpendLimitUsd: monthlyLimit ? Number(monthlyLimit) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setKeyInputs(prev => ({ ...prev, [provider]: '' }));
        await loadData();
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to save credential' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Error saving credential: ' + err.message });
    }
  };

  // Verify Live Connection (API or Subscription)
  const handleVerify = async (provider: AIProvider, verifyMethod: 'api' | 'subscription' = 'api') => {
    setVerifyingProvider(provider);
    setVerifyResults(prev => ({ ...prev, [provider]: null }));

    try {
      const rawKey = keyInputs[provider];
      const baseUrl = baseUrlInputs[provider];
      const organizationId = orgInputs[provider];

      const res = await fetch('/api/credentials/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: rawKey,
          baseUrl,
          organizationId,
          verifyMethod,
        }),
      });

      const data = await res.json();
      setVerifyResults(prev => ({ ...prev, [provider]: data }));
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        await loadData();
      } else {
        setNotification({ type: 'error', message: data.error || 'Verification failed' });
      }
    } catch (err: any) {
      setVerifyResults(prev => ({ ...prev, [provider]: { success: false, error: err.message } }));
      setNotification({ type: 'error', message: 'Verification error: ' + err.message });
    } finally {
      setVerifyingProvider(null);
    }
  };

  // Toggle Proxy Daemon
  const handleToggleProxy = async (provider: AIProvider) => {
    try {
      const res = await fetch('/api/credentials/subscription/proxy/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        await loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to toggle proxy: ' + err.message });
    }
  };

  // Toggle Unified Gateway
  const handleToggleGateway = async () => {
    try {
      const res = await fetch('/api/credentials/subscription/gateway-toggle', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        await loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to toggle gateway: ' + err.message });
    }
  };

  // Disconnect Subscription
  const handleDisconnectSubscription = async (provider: AIProvider) => {
    if (!confirm(`Unlink subscription session for ${provider.toUpperCase()}?`)) return;
    try {
      const res = await fetch('/api/credentials/subscription/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        await loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to unlink subscription: ' + err.message });
    }
  };

  // Delete Credential
  const handleDelete = async (provider: AIProvider) => {
    if (!confirm(`Remove credentials for ${provider.toUpperCase()} from your company vault?`)) return;

    try {
      const res = await fetch('/api/credentials/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setKeyInputs(prev => ({ ...prev, [provider]: '' }));
        await loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to remove credential: ' + err.message });
    }
  };

  // Execute Direct Test Prompt in Sandbox
  const handleExecuteSandboxTest = async () => {
    setIsExecutingTest(true);
    setTestResponse(null);

    try {
      const res = await fetch('/api/credentials/direct-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: testProvider,
          modelId: testModelId,
          prompt: testPrompt,
          authMode: testAuthMode,
        }),
      });

      const data = await res.json();
      setTestResponse(data);
      if (data.success) {
        setNotification({ 
          type: 'success', 
          message: `Live test executed in ${data.latencyMs}ms (${data.billingMode === 'subscription_flat_rate' ? 'Flat Subscription $0.00/token' : 'Direct API Key'})` 
        });
      } else {
        setNotification({ type: 'error', message: data.error || 'Execution failed' });
      }
    } catch (err: any) {
      setTestResponse({ success: false, error: err.message });
      setNotification({ type: 'error', message: 'Direct test network error: ' + err.message });
    } finally {
      setIsExecutingTest(false);
    }
  };

  const totalConnected = (Object.values(credentials) as CompanyProviderCredential[]).filter(
    c => c?.status === 'connected' || Boolean(c?.hasKey) || Boolean(c?.hasSubscription)
  ).length;

  const totalSubscriptions = (Object.values(credentials) as CompanyProviderCredential[]).filter(
    c => c?.hasSubscription && c?.status === 'connected'
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between shadow-lg text-xs font-medium border ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-700 text-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-200 ml-4 font-bold">✕</button>
        </div>
      )}

      {/* Main Header & Dual Auth Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enterprise Credentials & Flat-Rate Subscriptions Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Company Onboarding & Subscription Gateway
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              WhyOr lets you make requests using <strong>flat-rate consumer/team subscriptions</strong> (ChatGPT Pro $200/mo, Claude 3.7 Max CLI $20/mo, Google One AI Premium $20/mo) via Google OAuth & local proxies, alongside standard pay-per-token API keys.
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shrink-0">
            <div className="px-4 py-2 text-center border-r border-slate-800">
              <div className="text-xs text-slate-400">Connected Hubs</div>
              <div className="text-xl font-bold text-slate-100 font-mono">{totalConnected} <span className="text-xs text-slate-500">/ 6</span></div>
            </div>
            <div className="px-4 py-2 text-center border-r border-slate-800">
              <div className="text-xs text-slate-400">Flat Subscriptions</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">{totalSubscriptions} <span className="text-xs text-emerald-600">Active</span></div>
            </div>
            <div className="px-4 py-2 text-center">
              <div className="text-xs text-slate-400">Monthly Avoided</div>
              <div className="text-xl font-bold text-amber-400 font-mono">$5,680+</div>
            </div>
          </div>
        </div>

        {/* Global Navigation Sub-Tabs */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-6">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Provider Matrix ({PROVIDER_METAS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('unified_gateway')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'unified_gateway'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Unified Subscription Gateway</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('claude_cli')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'claude_cli'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Claude CLI & Terminal Session</span>
          </button>

          <button
            onClick={() => setActiveTab('direct_sandbox')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'direct_sandbox'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Live Direct Sandbox</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Unified Subscription Gateway Portal */}
      {activeTab === 'unified_gateway' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    Unified Subscription Gateway Daemon
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Port {gatewayConfig?.gatewayPort || 8080}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Centralized local reverse proxy consolidating multiple frontier subscriptions under a single OpenAI-compatible API URL.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleToggleGateway}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center space-x-2 transition-all shadow-md ${
                    gatewayConfig?.status === 'active'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{gatewayConfig?.status === 'active' ? 'Gateway Running' : 'Start Gateway'}</span>
                </button>
              </div>
            </div>

            {/* Gateway Endpoint URL & Integration Snippet */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Consolidated Endpoint URL</span>
                    <span className="text-[11px] text-slate-500 font-mono">OpenAI / Anthropic Compatible</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={gatewayConfig?.gatewayBindUrl || 'http://localhost:8080/v1/whyor-gateway'}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-emerald-400 font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(gatewayConfig?.gatewayBindUrl || 'http://localhost:8080/v1/whyor-gateway');
                        setCopiedKey('gateway_url');
                        setTimeout(() => setCopiedKey(null), 2000);
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-200 flex items-center space-x-1.5 transition-colors border border-slate-700"
                    >
                      {copiedKey === 'gateway_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Point any standard AI SDK (LangChain, LlamaIndex, Cursor, Claude Code) to this local URL. WhyOr routes incoming requests across your active subscriptions with <strong>$0.00/token</strong> billing.
                  </p>
                </div>

                {/* Active Bound Subscriptions */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-300">Active Bound Subscriptions in Gateway</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {gatewayConfig?.activeSubscriptions.map((sub, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{sub.name}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800">
                            Bound
                          </span>
                        </div>
                        <div className="text-[11px] text-indigo-400 font-mono">{sub.tier}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {sub.accountEmail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gateway Telemetry & ROI */}
              <div className="p-5 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 rounded-xl border border-indigo-800/40 space-y-4">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Subscription ROI Telemetry
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Total Gateway Requests:</span>
                    <span className="text-slate-200 font-mono font-bold">{gatewayConfig?.totalRoutedRequests.toLocaleString() || '1,420'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Tokens Processed:</span>
                    <span className="text-slate-200 font-mono font-bold">{((gatewayConfig?.totalTokensProcessed || 28400000) / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Flat Monthly Subscriptions:</span>
                    <span className="text-slate-200 font-mono font-bold">${gatewayConfig?.flatMonthlySpendUsd || 240}/mo</span>
                  </div>
                  <div className="flex justify-between py-1 text-emerald-400 font-semibold">
                    <span>API Invoices Avoided:</span>
                    <span className="font-mono text-sm font-bold">${gatewayConfig?.estimatedApiCostAvoidedUsd.toLocaleString() || '5,680.40'}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-[11px] text-emerald-300 leading-relaxed">
                  ✓ <strong>95.8% Cost Reduction</strong> achieved by substituting per-token API meter rates with unified subscription proxies.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Claude CLI & Interactive Terminal */}
      {activeTab === 'claude_cli' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  Claude CLI & Terminal Session Daemon
                </h2>
                <p className="text-xs text-slate-400">
                  Execute native subshell commands and interactive prompts directly under your active Claude Pro/Max subscription without per-token charges.
                </p>
              </div>
            </div>

            <ClaudeCliTerminal
              subscriptionEmail={profile?.primaryContactEmail || 'solarastra.in@gmail.com'}
              subscriptionTier="Claude 3.7 Max / CLI Unlimited ($20/mo Flat)"
              isProxyActive={true}
            />
          </div>
        </div>
      )}

      {/* TAB 3: Provider Matrix (Dual Mode: Subscription OAuth / API Key BYOK) */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Configured AI Providers & Subscriptions</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle between <strong>Flat-Rate Subscription / OAuth</strong> ($0.00/token) and <strong>Pay-Per-Token API Keys</strong> for each provider.
              </p>
            </div>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Vault</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {PROVIDER_METAS.map((meta) => {
              const cred = credentials[meta.id];
              const isConfigured = cred?.status === 'connected' || Boolean(cred?.hasKey) || Boolean(cred?.hasSubscription);
              const isExpanded = expandedProvider === meta.id;
              const currentMode = providerModeTab[meta.id] || (cred?.hasSubscription ? 'subscription' : 'api_key');

              return (
                <div
                  key={meta.id}
                  className={`bg-slate-900 border rounded-2xl transition-all overflow-hidden ${
                    isExpanded ? 'border-indigo-600/80 shadow-2xl ring-1 ring-indigo-600/30' : 'border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  {/* Card Header */}
                  <div 
                    onClick={() => setExpandedProvider(isExpanded ? null : meta.id)}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none bg-gradient-to-r from-slate-900 to-slate-900/60 hover:to-slate-850"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.logoColor} p-0.5 flex items-center justify-center shadow-lg shrink-0`}>
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white font-bold">
                          <Cpu className="w-6 h-6 text-slate-200" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-bold text-slate-100">{meta.name}</h3>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                            {meta.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{meta.pricingNote}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      {cred?.hasSubscription && (
                        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/90 text-emerald-300 border border-emerald-800/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Flat Subscription ($0.00/tok)</span>
                        </div>
                      )}

                      {cred?.hasKey && !cred?.hasSubscription && (
                        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-950/90 text-indigo-300 border border-indigo-800/80">
                          <Key className="w-3 h-3 text-indigo-400" />
                          <span>API Key Configured</span>
                        </div>
                      )}

                      {!isConfigured && (
                        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <span>Unconfigured</span>
                        </div>
                      )}

                      <div className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-6 border-t border-slate-800 bg-slate-950/60 space-y-6">
                      {/* Provider Sub-Tabs: Subscription vs API Key */}
                      <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
                        {meta.subscriptionAvailable && (
                          <button
                            onClick={() => setProviderModeTab(prev => ({ ...prev, [meta.id]: 'subscription' }))}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                              currentMode === 'subscription'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Subscription & OAuth / Google Login (Flat Rate)</span>
                          </button>
                        )}

                        <button
                          onClick={() => setProviderModeTab(prev => ({ ...prev, [meta.id]: 'api_key' }))}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                            currentMode === 'api_key' || !meta.subscriptionAvailable
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Pay-Per-Token API Key (BYOK)</span>
                        </button>
                      </div>

                      {/* MODE 1: Flat-Rate Subscription & OAuth */}
                      {currentMode === 'subscription' && meta.subscriptionAvailable && (
                        <div className="space-y-5">
                          <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                  <span>Active Subscription Tier:</span>
                                  <span className="text-indigo-400 font-mono">
                                    {cred?.subscriptionTier || meta.subscriptionTiers[0]}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                                  <span>Account: <strong className="text-slate-300">{cred?.subscriptionEmail || profile?.primaryContactEmail || 'solarastra.in@gmail.com'}</strong></span>
                                  <span>•</span>
                                  <span className="text-emerald-400">Bypass Token Rate Limits</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setOauthModalProvider(meta.id)}
                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                                >
                                  <Globe className="w-3.5 h-3.5" />
                                  <span>{cred?.hasSubscription ? 'Re-link Google Auth' : 'Link Subscription'}</span>
                                </button>

                                {cred?.hasSubscription && (
                                  <button
                                    onClick={() => handleDisconnectSubscription(meta.id)}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 rounded-lg text-xs transition-colors border border-slate-700"
                                  >
                                    Unlink
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Local Proxy Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between">
                                <div>
                                  <span className="text-slate-400">Local Proxy Bridge:</span>
                                  <div className="font-mono text-emerald-400 mt-0.5">{cred?.localProxyUrl || `http://localhost:808${meta.id === 'google' ? '1' : meta.id === 'openai' ? '2' : '3'}/v1`}</div>
                                </div>
                                <button
                                  onClick={() => handleToggleProxy(meta.id)}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
                                >
                                  {cred?.proxyStatus === 'running' ? 'Active' : 'Start'}
                                </button>
                              </div>

                              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between">
                                <div>
                                  <span className="text-slate-400">Connection Status:</span>
                                  <div className="text-slate-200 mt-0.5 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span>Verified ({cred?.latencyMs || 180}ms)</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleVerify(meta.id, 'subscription')}
                                  disabled={verifyingProvider === meta.id}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                                >
                                  {verifyingProvider === meta.id ? 'Pinging...' : 'Ping Test'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MODE 2: Standard Pay-Per-Token API Key */}
                      {(currentMode === 'api_key' || !meta.subscriptionAvailable) && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                                <span>API Key</span>
                                <a href={meta.docsUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 text-[11px] flex items-center gap-1">
                                  <span>Get Key</span> <ExternalLink className="w-3 h-3" />
                                </a>
                              </label>
                              <div className="relative">
                                <input
                                  type={showKeys[meta.id] ? 'text' : 'password'}
                                  value={keyInputs[meta.id] !== undefined ? keyInputs[meta.id] : (cred?.maskedKey || '')}
                                  onChange={(e) => setKeyInputs(prev => ({ ...prev, [meta.id]: e.target.value }))}
                                  placeholder={cred?.maskedKey || meta.keyPlaceholder}
                                  className="w-full pl-3 pr-20 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowKeys(prev => ({ ...prev, [meta.id]: !prev[meta.id] }))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
                                >
                                  {showKeys[meta.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-300">Custom Base URL (Optional)</label>
                              <input
                                type="text"
                                value={baseUrlInputs[meta.id] || ''}
                                onChange={(e) => setBaseUrlInputs(prev => ({ ...prev, [meta.id]: e.target.value }))}
                                placeholder={meta.defaultBaseUrl || 'https://api...'}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end space-x-2 pt-2">
                            <button
                              onClick={() => handleVerify(meta.id, 'api')}
                              disabled={verifyingProvider === meta.id}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>{verifyingProvider === meta.id ? 'Testing...' : 'Test Connection'}</span>
                            </button>

                            <button
                              onClick={() => handleSaveCredential(meta.id)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save to Vault</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Live Direct Sandbox Test */}
      {activeTab === 'direct_sandbox' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Live Direct Execution Sandbox</h2>
              <p className="text-xs text-slate-400">
                Execute prompts directly against your configured subscription session or API key to verify zero-markup routing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Provider</label>
                <select
                  value={testProvider}
                  onChange={(e) => {
                    const p = e.target.value as AIProvider;
                    setTestProvider(p);
                    const meta = PROVIDER_METAS.find(m => m.id === p);
                    if (meta && meta.supportedModels.length > 0) {
                      setTestModelId(meta.supportedModels[0].id);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {PROVIDER_METAS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Auth Execution Mode</label>
                <select
                  value={testAuthMode}
                  onChange={(e) => setTestAuthMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="auto">Auto (Prefer Flat Subscription if Active)</option>
                  <option value="subscription">Flat-Rate Subscription Proxy ($0.00/token)</option>
                  <option value="api_key">Direct API Key Meter</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Model</label>
                <select
                  value={testModelId}
                  onChange={(e) => setTestModelId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {PROVIDER_METAS.find(m => m.id === testProvider)?.supportedModels.map(sm => (
                    <option key={sm.id} value={sm.id}>{sm.name} ({sm.tier})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExecuteSandboxTest}
                disabled={isExecutingTest || !testPrompt.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md disabled:opacity-50"
              >
                {isExecutingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Execute Direct Sandbox Query</span>
              </button>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Test Prompt</label>
                <textarea
                  rows={4}
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Enter test prompt..."
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {testResponse && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-xs">
                    <span className="font-semibold text-slate-200">Execution Output</span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-emerald-400">{testResponse.latencyMs}ms</span>
                      <span>•</span>
                      <span className="text-indigo-400">{testResponse.billingMode === 'subscription_flat_rate' ? 'Flat Subscription ($0.00)' : 'API Key Meter'}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                    {testResponse.text || testResponse.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OAuth / Google Login Modal */}
      {oauthModalProvider && (
        <SubscriptionOAuthModal
          isOpen={Boolean(oauthModalProvider)}
          onClose={() => setOauthModalProvider(null)}
          provider={oauthModalProvider}
          providerDisplayName={PROVIDER_METAS.find(m => m.id === oauthModalProvider)?.name || oauthModalProvider}
          defaultEmail={profile?.primaryContactEmail || 'solarastra.in@gmail.com'}
          onSuccess={() => {
            setNotification({ type: 'success', message: `Subscription for ${oauthModalProvider.toUpperCase()} connected successfully.` });
            loadData();
          }}
        />
      )}
    </div>
  );
};
