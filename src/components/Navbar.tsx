import React, { useState, useEffect } from 'react';
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
  UserCheck
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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activePersona,
  setActivePersona,
  onOpenApiExplorer,
  onOpenQualityInspector,
}) => {
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthChanged((u) => {
      setFirebaseUser(u);
    });
    return () => unsub();
  }, []);

  // Admin Console is strictly accessible ONLY to solarastra.in@gmail.com
  const isSuperAdmin = (firebaseUser?.email === 'solarastra.in@gmail.com') || (activePersona.email === 'solarastra.in@gmail.com');

  const navItems = [
    { id: 'dispatch', label: 'Dispatch Console', icon: Cpu },
    { id: 'credentials', label: 'Company BYOK', icon: KeyRound, badge: 'Direct' },
    { id: 'analytics', label: 'Savings & Trends', icon: BarChart3 },
    { id: 'ledger', label: 'Context Ledger', icon: Database },
    { id: 'catalog', label: 'Models & Tools', icon: Layers },
    { 
      id: 'teams', 
      label: 'Team & Governance', 
      icon: Users,
      badge: activePersona.role === 'team_admin' || activePersona.isCompanyAdmin ? 'Admin' : undefined
    },
    // Admin Console is ONLY visible after the user is authenticated as solarastra.in@gmail.com
    ...(isSuperAdmin ? [{ 
      id: 'admin', 
      label: 'Admin Console', 
      icon: ShieldCheck,
      badge: 'SuperAdmin'
    }] : []),
    { id: 'research', label: 'Market Architecture', icon: BookOpen },
  ];

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
    <nav className="sticky top-0 z-50 bg-slate-950/40 backdrop-blur-2xl border-b border-white/[0.08] shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Domain */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentTab('dispatch')} 
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/20 backdrop-blur-md group-hover:border-orange-400/80 transition-all shadow-inner">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(251,146,60,0.8)] animate-pulse-glow" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-display font-bold text-base tracking-tight text-white">
                  WhyOr <span className="text-slate-400 font-normal">Dispatch</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 font-medium">
                  <Globe className="w-2.5 h-2.5" />
                  ai.whyor.in
                </div>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all backdrop-blur-md cursor-pointer ${
                    isActive
                      ? 'bg-white/[0.12] text-white border border-white/20 shadow-md shadow-black/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Buttons & Persona Switcher */}
          <div className="flex items-center gap-2.5">
            
            {/* OpenAPI / FastAPI Sandbox Trigger */}
            {onOpenApiExplorer && (
              <button
                id="open-api-explorer-btn"
                onClick={onOpenApiExplorer}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-mono font-medium backdrop-blur-md transition-all cursor-pointer shadow-sm hover:border-cyan-400/50"
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
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-mono font-medium backdrop-blur-md transition-all cursor-pointer shadow-sm hover:border-amber-400/50"
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
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono backdrop-blur-md transition-all cursor-pointer border ${
                firebaseUser?.email === 'solarastra.in@gmail.com' || activePersona.email === 'solarastra.in@gmail.com'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/20'
                  : firebaseUser
                  ? 'bg-blue-500/10 text-blue-300 border-blue-400/30 hover:bg-blue-500/20'
                  : 'bg-white/[0.05] text-slate-300 border-white/10 hover:bg-white/[0.1]'
              }`}
              title={firebaseUser ? `Authenticated as ${firebaseUser.email}` : "Sign in with Google"}
            >
              {firebaseUser ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate max-w-[90px]">{firebaseUser.displayName || firebaseUser.email?.split('@')[0]}</span>
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
            <div className="relative">
              <button
                id="persona-switcher-btn"
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/15 backdrop-blur-md transition-all text-left cursor-pointer"
              >
              <img
                src={activePersona.avatar}
                alt={activePersona.name}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-orange-400/50 shadow-sm"
              />
              <div className="hidden sm:block">
                <div className="text-xs font-medium text-white flex items-center gap-1.5">
                  {activePersona.name}
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full uppercase font-semibold ${
                    activePersona.role === 'platform_admin' ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' :
                    activePersona.role === 'team_admin' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' :
                    activePersona.role === 'team_member' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' :
                    activePersona.role === 'user' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                    'bg-slate-700/50 text-slate-300 border border-white/10'
                  }`}>
                    {activePersona.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                  {activePersona.title}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Persona Switcher Dropdown */}
            {personaMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-white/15 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
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
          </div>

        </div>
      </div>

      {/* Mobile nav subbar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 bg-slate-950/60 backdrop-blur-xl border-t border-white/[0.08] gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs whitespace-nowrap backdrop-blur-md ${
                isActive ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-md' : 'text-slate-400'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
