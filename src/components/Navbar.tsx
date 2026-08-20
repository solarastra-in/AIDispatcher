import React, { useState, useEffect, useRef } from 'react';
import { UserPersona, UserRole } from '../types';
import { PERSONA_PROFILES } from '../data/mockData';
import { 
  Cpu, 
  Layers, 
  Database, 
  Users, 
  ShieldCheck, 
  BookOpen, 
  ChevronDown, 
  Sparkles,
  Globe,
  Lock,
  Zap,
  Code2,
  Activity,
  BarChart3,
  KeyRound,
  LogIn,
  LogOut,
  UserCheck,
  MessageSquare,
  Compass,
  CheckCircle2,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { auth, signInWithGoogle, signOutUser, onAuthChanged } from '../lib/firebase';
import { User } from 'firebase/auth';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activePersona: UserPersona;
  setActivePersona: (persona: UserPersona) => void;
  onOpenApiExplorer?: () => void;
  onOpenQualityInspector?: () => void;
  onOpenAuthGate?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activePersona,
  setActivePersona,
  onOpenApiExplorer,
  onOpenQualityInspector,
  onOpenAuthGate,
}) => {
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const personaMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthChanged((u) => {
      setFirebaseUser(u);
    });
    return () => unsub();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (personaMenuRef.current && !personaMenuRef.current.contains(e.target as Node)) {
        setPersonaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Admin Console is strictly accessible ONLY to solarastra.in@gmail.com
  const isSuperAdmin = (firebaseUser?.email === 'solarastra.in@gmail.com') || (activePersona.email === 'solarastra.in@gmail.com');

  // Primary 4 top tabs to keep navigation uncluttered and prevent horizontal overflow
  const primaryNavItems = [
    { id: 'home', label: 'Overview', icon: Sparkles, badge: undefined },
    { id: 'dispatch', label: 'Dispatch Console', icon: Cpu, badge: 'Chat & Route' },
    { id: 'pricing', label: 'Pricing & 7-Day Trial', icon: Sparkles, badge: 'No CC' },
    { id: 'credentials', label: 'Company BYOK', icon: KeyRound, badge: 'Direct' },
  ];

  // Secondary platform tools accessible through the "Platform Hub" dropdown & in-page linkings
  const platformToolsItems = [
    { 
      id: 'analytics', 
      label: 'Savings & Trends', 
      description: 'ROI telemetry, token reductions & latency analytics',
      icon: BarChart3, 
      color: 'text-emerald-400' 
    },
    { 
      id: 'ledger', 
      label: 'Context Ledger', 
      description: 'SHA-256 state compression & context deduplication',
      icon: Database, 
      color: 'text-cyan-400' 
    },
    { 
      id: 'catalog', 
      label: 'Models & Tools Catalog', 
      description: '18+ model price/throughput directory & custom tool bindings',
      icon: Layers, 
      color: 'text-amber-400' 
    },
    { 
      id: 'teams', 
      label: 'Team & Governance', 
      description: 'Multi-seat RBAC roles, department policies & rate limits',
      icon: Users, 
      color: 'text-purple-400',
      badge: activePersona.role === 'team_admin' || activePersona.isCompanyAdmin ? 'Admin' : undefined
    },
    { 
      id: 'research', 
      label: 'Market Architecture', 
      description: 'Routing benchmarks, Pareto frontiers & architectural research',
      icon: BookOpen, 
      color: 'text-blue-400' 
    },
    { 
      id: 'contact', 
      label: 'Contact Us', 
      description: 'Enterprise inquiries, custom SLAs & dedicated private VPCs',
      icon: MessageSquare, 
      color: 'text-orange-400' 
    },
    // Admin Console is ONLY visible after the user is authenticated as solarastra.in@gmail.com
    ...(isSuperAdmin ? [{ 
      id: 'admin', 
      label: 'SuperAdmin Console', 
      description: 'Global model catalog management, audit logs & telemetry',
      icon: ShieldCheck, 
      color: 'text-rose-400',
      badge: 'SuperAdmin'
    }] : []),
  ];

  // Check if current tab is in the "Platform Hub" dropdown
  const isPlatformToolActive = platformToolsItems.some(item => item.id === currentTab);

  const handleGoogleAuth = async () => {
    setIsSigningIn(true);
    try {
      if (firebaseUser) {
        await signOutUser();
      } else {
        const { user } = await signInWithGoogle();
        if (user.email === 'solarastra.in@gmail.com') {
          const superPersona = PERSONA_PROFILES.find(p => p.email === 'solarastra.in@gmail.com');
          if (superPersona) setActivePersona(superPersona);
        }
      }
    } catch (err) {
      console.warn('Google auth notification:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/[0.08] shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Brand & Domain */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              id="navbar-brand-logo-btn"
              onClick={() => {
                setCurrentTab('home');
                setMobileMenuOpen(false);
              }} 
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/20 backdrop-blur-md group-hover:border-orange-400/80 transition-all shadow-inner">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(251,146,60,0.8)] animate-pulse-glow" />
              </div>
              <div>
                <div className="flex items-center gap-1 font-display font-bold text-sm sm:text-base tracking-tight text-white">
                  WhyOr <span className="text-slate-400 font-normal">Dispatch</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-cyan-400 font-medium">
                  <Globe className="w-2.5 h-2.5" />
                  ai.whyor.in
                </div>
              </div>
            </button>
          </div>

          {/* Primary Navigation Links (Uncluttered Desktop Layout) */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-1.5">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all backdrop-blur-md cursor-pointer ${
                    isActive
                      ? 'bg-white/[0.12] text-white border border-white/20 shadow-md shadow-black/20 font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Platform Hub Dropdown for Secondary Tools */}
            <div className="relative" ref={moreMenuRef}>
              <button
                id="nav-btn-platform-hub"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all backdrop-blur-md cursor-pointer ${
                  isPlatformToolActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Platform Hub</span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono rounded-full bg-white/10 text-slate-300">
                  +{platformToolsItems.length}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${moreMenuOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
              </button>

              {/* Platform Hub Dropdown Menu */}
              {moreMenuOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                  <div className="px-2.5 py-1.5 border-b border-white/10 mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                      Platform Tools & Governance
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ai.whyor.in
                    </span>
                  </div>

                  {platformToolsItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`nav-more-${item.id}`}
                        onClick={() => {
                          setCurrentTab(item.id);
                          setMoreMenuOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-white/[0.12] border border-cyan-400/40 text-white' 
                            : 'hover:bg-white/[0.06] text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${item.color} mt-0.5 shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white truncate">{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons & Persona Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* 7-Day Free Trial CTA / Sign-up Button when not signed in */}
            {!firebaseUser && (
              <button
                id="navbar-trial-cta-btn"
                onClick={() => {
                  if (onOpenAuthGate) {
                    onOpenAuthGate();
                  } else {
                    setCurrentTab('pricing');
                  }
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                title="Start 7-Day Free Trial — No Credit Card Required"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start 7-Day Trial</span>
                <span className="text-[9px] font-mono bg-slate-950/20 px-1.5 py-0.2 rounded-full text-slate-950 uppercase font-black">
                  No CC
                </span>
              </button>
            )}

            {/* OpenAPI / FastAPI Sandbox Trigger */}
            {onOpenApiExplorer && (
              <button
                id="open-api-explorer-btn"
                onClick={onOpenApiExplorer}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-mono font-medium backdrop-blur-md transition-all cursor-pointer shadow-sm hover:border-cyan-400/50"
                title="Open WhyOr FastAPI v1 Interactive Endpoint Sandbox (14 Endpoints)"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>API Surface</span>
                <span className="px-1 py-0.2 rounded text-[9px] bg-cyan-400/20 font-bold">14</span>
              </button>
            )}

            {/* Quality Engine Trigger */}
            {onOpenQualityInspector && (
              <button
                id="open-quality-inspector-btn"
                onClick={onOpenQualityInspector}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-mono font-medium backdrop-blur-md transition-all cursor-pointer shadow-sm hover:border-amber-400/50"
                title="Open Bayesian Beta Quality Tracker & Thompson Sampling Inspector"
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Beta(α,β)</span>
              </button>
            )}

            {/* Google Identity & SuperAdmin Status Button */}
            <button
              id="google-auth-trigger-btn"
              onClick={handleGoogleAuth}
              disabled={isSigningIn}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono backdrop-blur-md transition-all cursor-pointer border ${
                firebaseUser?.email === 'solarastra.in@gmail.com' || activePersona.email === 'solarastra.in@gmail.com'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/20'
                  : firebaseUser
                  ? 'bg-blue-500/10 text-blue-300 border-blue-400/30 hover:bg-blue-500/20'
                  : 'bg-white/[0.05] text-slate-300 border-white/10 hover:bg-white/[0.1]'
              }`}
              title={firebaseUser ? `Authenticated as ${firebaseUser.email}` : "Sign in with Google (No Credit Card Required)"}
            >
              {firebaseUser ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate max-w-[80px] sm:max-w-[100px]">{firebaseUser.displayName || firebaseUser.email?.split('@')[0]}</span>
                  {firebaseUser.email === 'solarastra.in@gmail.com' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-bold">Admin</span>
                  )}
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                  <span>Google SSO</span>
                </>
              )}
            </button>

            {/* Persona Switcher */}
            <div className="relative" ref={personaMenuRef}>
              <button
                id="persona-switcher-btn"
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/15 backdrop-blur-md transition-all text-left cursor-pointer"
              >
                <img
                  src={activePersona.avatar}
                  alt={activePersona.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-orange-400/50 shadow-sm"
                />
                <div className="hidden md:block">
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    <span className="truncate max-w-[90px]">{activePersona.name}</span>
                    <span className={`text-[8px] font-mono px-1 py-0.2 rounded-full uppercase font-semibold ${
                      activePersona.role === 'platform_admin' ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' :
                      activePersona.role === 'team_admin' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' :
                      activePersona.role === 'team_member' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                      activePersona.role === 'user' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                      'bg-slate-700/50 text-slate-300 border border-white/10'
                    }`}>
                      {activePersona.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Persona Switcher Dropdown */}
              {personaMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-white/10 mb-1.5">
                    <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Persona RBAC Switcher
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Test routing rules, tier limits, and administrative views across roles.
                    </p>
                  </div>

                  <div className="space-y-1">
                    {PERSONA_PROFILES.map((p) => {
                      const isSelected = p.id === activePersona.id;
                      return (
                        <button
                          key={p.id}
                          id={`select-persona-${p.id}`}
                          onClick={() => {
                            setActivePersona(p);
                            setPersonaMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            isSelected ? 'bg-white/[0.12] border border-orange-400/50 shadow-sm' : 'hover:bg-white/[0.06] border border-transparent'
                          }`}
                        >
                          <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-white/20" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300">
                                {p.role.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{p.title}</div>
                            <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-cyan-400">
                              <span>Tiers: {p.allowedTiers.length} permitted</span>
                              {p.canBYOK && <span>• BYOK</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/10 transition-all cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/95 border-t border-white/[0.08] px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto backdrop-blur-2xl">
          
          {/* Core Navigation Items */}
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-bold px-2 mb-1">
              Core Hub
            </div>
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-md' 
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[9px] font-mono uppercase rounded-full bg-white/20 text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Platform Tools Items */}
          <div className="space-y-1 pt-2 border-t border-white/10">
            <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold px-2 mb-1">
              Platform Tools & Governance
            </div>
            {platformToolsItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 7-Day Free Trial Mobile Banner */}
          {!firebaseUser && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>7-Day Free Trial Available</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                No credit card required upfront. Includes managed Claude & Gemini subscriptions.
              </p>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenAuthGate) onOpenAuthGate();
                  else setCurrentTab('pricing');
                }}
                className="w-full py-2 rounded-xl bg-orange-500 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
              >
                Activate 7-Day Trial (No CC)
              </button>
            </div>
          )}

        </div>
      )}
    </nav>
  );
};

