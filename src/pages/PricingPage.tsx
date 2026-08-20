import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  KeyRound, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Cpu, 
  Database, 
  Building2, 
  HelpCircle,
  TrendingDown,
  Lock,
  ChevronDown
} from 'lucide-react';
import { UserTrialInfo, getUserTrialFromFirestore, auth, onAuthChanged } from '../lib/firebase';
import { AuthGateModal } from '../components/AuthGateModal';

interface PricingPageProps {
  onNavigateTab: (tab: string) => void;
  onOpenAuthGate?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigateTab, onOpenAuthGate }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [userTrial, setUserTrial] = useState<UserTrialInfo | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    // Check local storage or Firebase user
    const localUser = localStorage.getItem('whyor_trial_user');
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        getUserTrialFromFirestore(parsed.uid, parsed.email).then(t => {
          if (t) setUserTrial(t);
        });
      } catch (e) {}
    }

    const unsub = onAuthChanged((u) => {
      if (u) {
        getUserTrialFromFirestore(u.uid, u.email || undefined).then(t => {
          if (t) setUserTrial(t);
        });
      }
    });
    return () => unsub();
  }, []);

  const handleStartTrial = () => {
    if (userTrial) {
      onNavigateTab('dispatch');
    } else if (onOpenAuthGate) {
      onOpenAuthGate();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const faqs = [
    {
      q: "How does the 7-day free trial work with managed Claude & Gemini subscriptions?",
      a: "When you sign up, WhyOr Dispatch provides immediate, zero-friction access to our managed Claude 3.7 and Gemini 2.5/3.7 subscription pools. You don't need to enter any API keys or credit cards for 7 days, up to 100,000 tokens per day."
    },
    {
      q: "What happens when the 7-day free trial concludes?",
      a: "After 7 days, the platform transitions to the BYOK (Bring Your Own Key) or Paid Plan model. To continue dispatching prompts, you will configure your own API keys (Google Gemini, Anthropic Claude, OpenAI, DeepSeek, Groq, Mistral) in the Company BYOK page, or upgrade to an Enterprise managed pool."
    },
    {
      q: "How do monthly budget caps and daily usage alerts protect against overspending?",
      a: "WhyOr tracks both monthly spend ($) and daily token usage ($/day) across every configured key. If an engine's spend reaches your preset budget cap or daily limit, the platform immediately flags the key, triggers an alert, and safely diverts traffic to alternative eligible models."
    },
    {
      q: "Can I bring my own ChatGPT Plus, Claude Pro, or Gemini Advanced subscriptions?",
      a: "Yes! In the Company BYOK page, WhyOr supports subscription OAuth handshakes, local proxy bridges (OpenAI Codex CLI, Claude CLI), and direct API keys, allowing you to route through existing flat-rate seats."
    },
    {
      q: "How does WhyOr achieve up to 82% token and cost savings?",
      a: "Our AST semantic router classifies task complexity (7 archetypes) and uses Bayesian Thompson Sampling to route to the lowest-cost model that satisfies quality constraints, combined with cryptographic context deduplication."
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in pb-16">
      
      {/* HEADER SECTION */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Transparent & Economical Pricing
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-display text-white tracking-tight">
          Start with a <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">7-Day Free Trial</span>. Upgrade to Unlimited BYOK.
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Test intelligent multi-model routing risk-free using our managed Claude and Gemini subscription pool. Configure your own API engine keys anytime with automatic budget caps.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={`text-xs font-medium ${billingCycle === 'monthly' ? 'text-white font-bold' : 'text-slate-400'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(b => b === 'monthly' ? 'annual' : 'monthly')}
            className="w-12 h-6 rounded-full bg-slate-800 p-1 border border-white/10 transition-colors relative cursor-pointer"
          >
            <div className={`w-4 h-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className={`text-xs font-medium flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-white font-bold' : 'text-slate-400'}`}>
            Annual Billing
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* LIVE 7-DAY TRIAL TRACKER CARD IF SIGNED IN */}
      {userTrial && (
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-cyan-500/10 border border-orange-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 uppercase">
                  {userTrial.isTrialActive ? 'Active 7-Day Free Trial' : 'Trial Expired · BYOK Required'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {userTrial.email}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                {userTrial.isTrialActive 
                  ? `Day ${7 - userTrial.daysRemaining + 1} of 7 · ${userTrial.daysRemaining} Day${userTrial.daysRemaining === 1 ? '' : 's'} Remaining`
                  : 'Your 7-Day Free Trial has Concluded'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                {userTrial.isTrialActive
                  ? 'You are currently utilizing managed Claude & Gemini subscriptions with automated AST multi-model routing and cryptographic context compression.'
                  : 'Please configure your AI engine keys (Gemini, Claude, OpenAI, DeepSeek) in Company BYOK or upgrade to a Pro/Enterprise plan to continue prompt dispatches.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigateTab('dispatch')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Launch Dispatch Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('credentials')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Configure AI Engine Keys</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
            <div>
              Daily Usage: <span className="text-white font-bold">{userTrial.dailyTokensUsed.toLocaleString()}</span> / {userTrial.dailyTokenLimit.toLocaleString()} tokens
            </div>
            <div>
              Total Dispatches: <span className="text-orange-400 font-bold">{userTrial.totalDispatches}</span> requests processed
            </div>
          </div>
        </div>
      )}

      {/* PRICING TIERS GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* PLAN 1: 7-DAY FREE TRIAL */}
        <div className="bg-slate-900/70 border border-white/15 hover:border-orange-500/50 rounded-3xl p-7 backdrop-blur-xl shadow-xl flex flex-col justify-between relative group transition-all">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Zero Friction Start
              </div>
              <h3 className="text-2xl font-bold font-display text-white">7-Day Free Trial</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Test the full power of WhyOr with managed Claude & Gemini subscriptions without providing credit cards or keys.
              </p>
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-mono text-white">$0</span>
                <span className="text-xs text-slate-400 font-mono">/ for 7 days</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-mono mt-1">
                Includes managed Claude 3.7 & Gemini 2.5
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs font-medium text-slate-300">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Managed Admin Claude & Gemini subscription pool</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>100,000 trial tokens per day</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>7-Archetype AST semantic task classifier</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Cryptographic Context Ledger with SHA-256 state</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>WhyOr Corroborate & Relay synthesis engines</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={handleStartTrial}
              className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{userTrial ? 'Launch Free Trial' : 'Start 7-Day Free Trial'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-slate-500 text-center font-mono mt-2">
              No credit card required · Instant activation
            </p>
          </div>
        </div>

        {/* PLAN 2: PRO DEVELOPER (BYOK) */}
        <div className="bg-slate-900/90 border-2 border-orange-500/80 rounded-3xl p-7 backdrop-blur-xl shadow-2xl shadow-orange-500/10 flex flex-col justify-between relative transform md:-translate-y-2">
          
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold text-[11px] font-mono shadow-md uppercase tracking-wider">
            Most Popular · Developer BYOK
          </div>

          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                <KeyRound className="w-3.5 h-3.5" />
                Direct API Keys & Proxies
              </div>
              <h3 className="text-2xl font-bold font-display text-white">Developer Pro</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full multi-engine routing across all frontier models using your direct API credentials and CLI local proxies.
              </p>
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-mono text-white">
                  {billingCycle === 'monthly' ? '$29' : '$24'}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ user / month</span>
              </div>
              <p className="text-[11px] text-orange-400 font-mono mt-1">
                {billingCycle === 'annual' ? 'Billed annually ($288/yr)' : 'Billed monthly · Cancel anytime'}
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs font-medium text-slate-200">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>Unlimited BYOK routing (Gemini, Claude, OpenAI, DeepSeek, Groq, Mistral)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>Real-time Monthly Budget ($) & Daily Usage ($/day) limit alerts</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>Automatic Thompson-Sampling Pareto cost optimization</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>Full Firestore cloud persistence & context rehydration</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>File synthesis outputs (PDF, Excel, Diagram generation)</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => onNavigateTab('credentials')}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Configure BYOK & Upgrade</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-slate-400 text-center font-mono mt-2">
              Requires user API key configuration after 7 days
            </p>
          </div>
        </div>

        {/* PLAN 3: ENTERPRISE ORGANIZATION */}
        <div className="bg-slate-900/70 border border-white/15 hover:border-cyan-500/50 rounded-3xl p-7 backdrop-blur-xl shadow-xl flex flex-col justify-between relative group transition-all">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Building2 className="w-3.5 h-3.5" />
                Governance & Scale
              </div>
              <h3 className="text-2xl font-bold font-display text-white">Enterprise Org</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized credential pooling, RBAC token quotas, custom model whitelisting, and private VPC deployment.
              </p>
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-mono text-white">
                  {billingCycle === 'monthly' ? '$99' : '$79'}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ seat / month</span>
              </div>
              <p className="text-[11px] text-cyan-400 font-mono mt-1">
                Custom enterprise volume discounts available
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs font-medium text-slate-300">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Organization-wide subscription & BYOK pooling</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Granular RBAC (SuperAdmin, Team Lead, Member quotas)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Mandatory model whitelisting & restricted provider policies</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Zero Data Retention & SOC2 / HIPAA compliance posture</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>Dedicated SLA & custom on-premises VPC installation</span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => onNavigateTab('contact')}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Contact Enterprise Sales</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-slate-500 text-center font-mono mt-2">
              Custom deployment & dedicated support SLA
            </p>
          </div>
        </div>

      </div>

      {/* TECHNICAL SAFEGUARDS & OVERAGE MONITORING */}
      <div className="max-w-7xl mx-auto bg-slate-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-display text-white">
              Automated Cost Guardrails: Budget Caps & Daily Limit Alerts
            </h3>
            <p className="text-xs text-slate-400">
              How WhyOr safeguards developers and enterprises from unexpected API bill shock.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
            <div className="text-xs font-mono font-bold text-orange-400">01 · Monthly Budget Thresholds</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Set hard spending limits per API key (e.g. $500/mo). When cumulative spend reaches 100%, the router alerts the user and excludes that engine.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
            <div className="text-xs font-mono font-bold text-cyan-400">02 · Daily Rate & Token Caps</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Set max daily spend (e.g. $25/day) to prevent runaway loops. Over-limit keys trigger immediate UI banners and switch traffic to backup models.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
            <div className="text-xs font-mono font-bold text-emerald-400">03 · Post-Trial BYOK Enforcement</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              After the 7-day managed subscription trial, users provide direct keys to maintain continuous dispatch access with full cost transparency.
            </p>
          </div>
        </div>
      </div>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold font-display text-white">Frequently Asked Questions</h3>
          <p className="text-xs text-slate-400">Everything you need to know about trials, BYOK credentials, and routing.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = expandedFaq === i;
            return (
              <div 
                key={i} 
                className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : i)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer hover:bg-white/5"
                >
                  <span className="text-sm font-semibold text-white">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-orange-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Auth Gate Modal */}
      <AuthGateModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          getUserTrialFromFirestore(user.uid, user.email).then(t => {
            if (t) setUserTrial(t);
          });
          onNavigateTab('dispatch');
        }}
      />

    </div>
  );
};
