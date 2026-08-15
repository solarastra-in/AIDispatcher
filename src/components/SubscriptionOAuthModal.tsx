import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  Globe, 
  Terminal, 
  ArrowRight,
  RefreshCw,
  Mail,
  KeyRound,
  Info
} from 'lucide-react';
import { AIProvider } from '../types';

interface SubscriptionOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: AIProvider;
  providerDisplayName: string;
  defaultEmail?: string;
  onSuccess: () => void;
}

export const SubscriptionOAuthModal: React.FC<SubscriptionOAuthModalProps> = ({
  isOpen,
  onClose,
  provider,
  providerDisplayName,
  defaultEmail = 'solarastra.in@gmail.com',
  onSuccess,
}) => {
  const [authTab, setAuthTab] = useState<'google' | 'email' | 'session_token' | 'cli'>('google');
  const [emailInput, setEmailInput] = useState<string>(defaultEmail);
  const [selectedTier, setSelectedTier] = useState<string>(() => {
    if (provider === 'openai') return 'ChatGPT Pro Unlimited Reasoning ($200/mo Flat)';
    if (provider === 'anthropic') return 'Claude 3.7 Max / CLI Unlimited ($20/mo Flat)';
    if (provider === 'google') return 'Google One AI Premium / Gemini Advanced ($20/mo Flat)';
    return 'Web Subscription VIP (Flat Rate)';
  });
  const [sessionTokenInput, setSessionTokenInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (oauthType: string) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/credentials/subscription/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          email: emailInput.trim(),
          oauthType,
          subscriptionTier: selectedTier,
          sessionToken: sessionTokenInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setAuthError(data.error || 'Failed to authenticate subscription');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Network error connecting subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const getTierOptions = () => {
    if (provider === 'openai') {
      return [
        { id: 'ChatGPT Pro Unlimited Reasoning ($200/mo Flat)', name: 'ChatGPT Pro ($200/mo)', desc: 'Unlimited o1/o3-mini & GPT-4o reasoning without token limits' },
        { id: 'ChatGPT Plus Standard ($20/mo Flat)', name: 'ChatGPT Plus ($20/mo)', desc: 'High-speed GPT-4o standard consumer subscription' },
        { id: 'ChatGPT Team / Enterprise Workspace', name: 'ChatGPT Enterprise / Team', desc: 'Workspace SSO & unlimited team reasoning pool' },
      ];
    }
    if (provider === 'anthropic') {
      return [
        { id: 'Claude 3.7 Max / CLI Unlimited ($20/mo Flat)', name: 'Claude 3.7 Max / CLI ($20/mo)', desc: 'Full Claude CLI daemon + Claude 3.7 Sonnet hybrid reasoning' },
        { id: 'Claude Pro Flat Subscription ($20/mo)', name: 'Claude Pro ($20/mo)', desc: 'Standard consumer subscription with 5x usage allowances' },
        { id: 'Claude Team Workspace License', name: 'Claude Team', desc: 'Centralized organization billing & shared projects' },
      ];
    }
    if (provider === 'google') {
      return [
        { id: 'Google One AI Premium / Gemini Advanced ($20/mo Flat)', name: 'Google One AI Premium ($20/mo)', desc: 'Gemini 2.5 Pro & Deep Research unlimited flat allocation' },
        { id: 'Google Workspace Enterprise AI Add-on', name: 'Google Workspace AI', desc: 'Enterprise domain license with Google Cloud security guarantees' },
      ];
    }
    return [
      { id: 'DeepSeek VIP Web Session ($0.14/1M or Web Flat)', name: 'DeepSeek VIP Session', desc: 'Web session bypass with zero per-token surcharge' },
    ];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-200 relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Connect {providerDisplayName} Subscription
              </h3>
              <p className="text-xs text-slate-400">
                Link active flat-rate subscription via OAuth or local proxy daemon ($0.00/token)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cost Comparison Notice */}
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-3 text-xs text-emerald-300">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong>Flat-Rate Savings Advantage:</strong> Using your $20–$200/mo subscription eliminates per-token API meter rates, saving up to <strong>98.5%</strong> on high-volume developer workloads.
          </div>
        </div>

        {/* Auth Method Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setAuthTab('google')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authTab === 'google' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Auth</span>
          </button>
          <button
            onClick={() => setAuthTab('email')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authTab === 'email' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Login</span>
          </button>
          <button
            onClick={() => setAuthTab('session_token')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authTab === 'session_token' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Session Token</span>
          </button>
          <button
            onClick={() => setAuthTab('cli')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authTab === 'cli' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI Daemon</span>
          </button>
        </div>

        {/* Subscription Tier Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Select Subscription Tier</label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {getTierOptions().map((tier) => (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between text-xs ${
                  selectedTier === tier.id
                    ? 'bg-indigo-950/70 border-indigo-500 text-slate-100 shadow-sm'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-200">{tier.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{tier.desc}</div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                  selectedTier === tier.id ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-700'
                }`}>
                  {selectedTier === tier.id && <CheckCircle2 className="w-3 h-3" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Specific Form */}
        {authTab === 'google' && (
          <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300">Google Account Email</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@gmail.com or corporate domain"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Google Identity Services OAuth with PKCE flow & local session proxy bridge.</span>
            </div>

            <button
              onClick={() => handleConnect('google')}
              disabled={isLoading || !emailInput.trim()}
              className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-800" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google & Link Subscription</span>
            </button>
          </div>
        )}

        {authTab === 'email' && (
          <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300">Subscription Account Email</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => handleConnect('email_magic')}
              disabled={isLoading || !emailInput.trim()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>Send Magic Verification Link & Bind</span>
            </button>
          </div>
        )}

        {authTab === 'session_token' && (
          <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300">Web Session / Refresh Token</label>
              <input
                type="password"
                value={sessionTokenInput}
                onChange={(e) => setSessionTokenInput(e.target.value)}
                placeholder="sess-... or __Secure-next-auth.session-token..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Paste cookie token from active web session to bypass API rate metering entirely.
            </p>
            <button
              onClick={() => handleConnect('direct_session')}
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>Bind Session Token to Local Proxy</span>
            </button>
          </div>
        )}

        {authTab === 'cli' && (
          <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="p-3 bg-slate-900 rounded-lg font-mono text-[11px] text-amber-300 space-y-1 border border-slate-800">
              <div>$ claude auth login</div>
              <div className="text-slate-400"># Authenticates terminal session with active Claude Pro/Max subscription</div>
            </div>
            <p className="text-[11px] text-slate-400">
              Enables local subshell daemon executing native CLI sessions under your active organization license.
            </p>
            <button
              onClick={() => handleConnect('cli')}
              disabled={isLoading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
              <span>Activate Local Claude CLI Bridge</span>
            </button>
          </div>
        )}

        {authError && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs">
            {authError}
          </div>
        )}
      </div>
    </div>
  );
};
