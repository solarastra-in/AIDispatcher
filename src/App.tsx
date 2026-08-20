import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LiveDispatchBoard } from './components/LiveDispatchBoard';
import { DispatchConsole } from './components/DispatchConsole';
import { ContextLedgerView } from './components/ContextLedgerView';
import { ModelCatalog } from './components/ModelCatalog';
import { TeamGovernance } from './components/TeamGovernance';
import { AdminBilling } from './components/AdminBilling';
import { AdminConsole } from './components/AdminConsole';
import { MarketResearchView } from './components/MarketResearchView';
import { SavingsAnalyticsDashboard } from './components/SavingsAnalyticsDashboard';
import { CompanyCredentialsPage } from './components/CompanyCredentialsPage';
import { ApiExplorerModal } from './components/ApiExplorerModal';
import { QualityModelInspector } from './components/QualityModelInspector';
import { TrialProgressBarHeader } from './components/TrialProgressBarHeader';
import Workspace from './pages/Workspace';
import Home from './pages/Home';
import { PricingPage } from './pages/PricingPage';
import { ContactPage } from './pages/ContactPage';
import { AIModel, UserPersona, ContextLedgerEntry } from './types';
import { INITIAL_AI_MODELS, PERSONA_PROFILES } from './data/mockData';
import { apiService } from './core/apiSurface';
import { 
  saveLedgerEntryToFirestore, 
  loadLedgerFromFirestore, 
  saveContextSessionToFirestore,
  recordAuditLogToFirestore
} from './lib/firebase';
import { Globe, ArrowRight, ShieldCheck, Sparkles, Zap, Layers, Code2, Activity, Mail } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  // Default to Superadmin persona so all governance, models, and admin actions are accessible immediately
  const [activePersona, setActivePersona] = useState<UserPersona>(PERSONA_PROFILES[4] || PERSONA_PROFILES[0]);
  const [models, setModels] = useState<AIModel[]>(INITIAL_AI_MODELS);
  const [prefilledPrompt, setPrefilledPrompt] = useState<string | undefined>(undefined);
  const [prefilledModelId, setPrefilledModelId] = useState<string | undefined>(undefined);
  const [isApiExplorerOpen, setIsApiExplorerOpen] = useState<boolean>(false);
  const [isQualityInspectorOpen, setIsQualityInspectorOpen] = useState<boolean>(false);
  
  // Context Persistence Policy (Firestore Cloud by default vs Local Transient)
  const [persistenceMode, setPersistenceMode] = useState<'firestore_cloud' | 'local_transient'>('firestore_cloud');

  // Context Ledger state (persisted in Firestore & populated via live dispatches)
  const [ledger, setLedger] = useState<ContextLedgerEntry[]>([]);

  // Hydrate ledger from Firestore if available
  useEffect(() => {
    loadLedgerFromFirestore(30)
      .then((cloudEntries) => {
        if (cloudEntries && cloudEntries.length > 0) {
          setLedger(cloudEntries);
        }
      })
      .catch((err) => console.log('Loaded initial demo ledger state'));
  }, []);

  // Load models from server if available
  useEffect(() => {
    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setModels(data);
        }
      })
      .catch((err) => console.log('Using initial model catalog state'));
  }, []);

  const handleNewLedgerEntry = (entry: ContextLedgerEntry) => {
    setLedger((prev) => [entry, ...prev]);

    // If Firestore Cloud persistence is active, persist directly to Firestore
    if (persistenceMode === 'firestore_cloud') {
      saveLedgerEntryToFirestore(entry).catch((err) =>
        console.warn('Firestore ledger save notice:', err.message)
      );

      saveContextSessionToFirestore(entry.sessionId, {
        sessionId: entry.sessionId,
        promptSnippet: entry.promptSnippet,
        routedModelId: entry.routedModelId,
        routedModelName: entry.routedModelName,
        entitiesExtracted: entry.entitiesExtracted,
        decisionsMade: entry.decisionsMade,
        tokensSaved: entry.tokensSaved,
        updatedAt: new Date().toISOString(),
      }).catch((err) => console.warn('Firestore context save notice:', err.message));
    }
  };

  const handleAddModel = (newModel: AIModel) => {
    setModels((prev) => [newModel, ...prev]);
    // Also notify server
    fetch('/api/admin/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newModel),
    }).catch((e) => console.warn('Saved model in client catalog'));
  };

  const handleUpdateModelStatus = (id: string, status: AIModel['status']) => {
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
    fetch(`/api/admin/models/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch((e) => console.warn('Updated status in client catalog'));
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-orange-500 selection:text-white">
      {/* Frosted Glass Background Ambient Luminous Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-36 -left-36 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-2/3 left-10 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[130px]" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      </div>

      {/* Top Navbar */}
      <div className="relative z-50">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          activePersona={activePersona}
          setActivePersona={setActivePersona}
          onOpenApiExplorer={() => setIsApiExplorerOpen(true)}
          onOpenQualityInspector={() => setIsQualityInspectorOpen(!isQualityInspectorOpen)}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* 7-Day Free Trial Visual Progress Bar & Pro Upgrade Bar */}
        <TrialProgressBarHeader 
          onNavigateTab={setCurrentTab}
          activePersonaEmail={activePersona.email}
        />

        {/* Collapsible Quality Model & Thompson Sampling Inspector */}
        {isQualityInspectorOpen && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Live Bayesian Quality Inspector Mode
              </span>
              <button
                onClick={() => setIsQualityInspectorOpen(false)}
                className="text-xs font-mono text-slate-400 hover:text-white cursor-pointer"
              >
                [Minimize Inspector]
              </button>
            </div>
            <QualityModelInspector
              qualityTracker={apiService.qualityTracker}
              feedbackEngine={apiService.feedbackEngine}
              models={models}
              onSelectModelForDispatch={(modelId) => {
                setPrefilledModelId(modelId);
                setCurrentTab('dispatch');
              }}
            />
          </div>
        )}

        {/* Live Dispatch Telemetry Ticker */}
        {(currentTab === 'dispatch' || currentTab === 'catalog') && (
          <LiveDispatchBoard 
            onSelectPrompt={(p) => {
              setPrefilledPrompt(p);
              setCurrentTab('dispatch');
            }}
          />
        )}

        {/* Tab Views */}
        {currentTab === 'dispatch' && (
          <DispatchConsole
            models={models}
            activePersona={activePersona}
            onNewLedgerEntry={handleNewLedgerEntry}
            recentLedger={ledger}
            onNavigateTab={setCurrentTab}
            prefilledPrompt={prefilledPrompt}
            prefilledModelId={prefilledModelId}
            onClearPrefill={() => {
              setPrefilledPrompt(undefined);
              setPrefilledModelId(undefined);
            }}
          />
        )}

        {currentTab === 'credentials' && (
          <CompanyCredentialsPage
            onNavigateToDispatch={(p, m) => {
              if (p) setPrefilledPrompt(p);
              if (m) setPrefilledModelId(m);
              setCurrentTab('dispatch');
            }}
          />
        )}

        {currentTab === 'analytics' && (
          <SavingsAnalyticsDashboard
            activePersona={activePersona}
            ledger={ledger}
            onNavigateTab={setCurrentTab}
            onPrefillPrompt={(p) => {
              setPrefilledPrompt(p);
              setCurrentTab('dispatch');
            }}
          />
        )}

        {currentTab === 'ledger' && (
          <ContextLedgerView
            ledger={ledger}
            activePersona={activePersona}
            onNavigateTab={setCurrentTab}
            persistenceMode={persistenceMode}
            onTogglePersistenceMode={setPersistenceMode}
          />
        )}

        {currentTab === 'catalog' && (
          <ModelCatalog
            models={models}
            onAddModel={handleAddModel}
            onUpdateModelStatus={handleUpdateModelStatus}
            activePersona={activePersona}
            onNavigateTab={setCurrentTab}
            onSelectModelForDispatch={(modelId) => {
              setPrefilledModelId(modelId);
              setCurrentTab('dispatch');
            }}
          />
        )}

        {currentTab === 'teams' && (
          <TeamGovernance
            activePersona={activePersona}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'admin' && (
          <AdminConsole
            onNavigateTab={setCurrentTab}
            persistenceMode={persistenceMode}
            onTogglePersistenceMode={setPersistenceMode}
          />
        )}

        {currentTab === 'research' && (
          <MarketResearchView 
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'pricing' && (
          <PricingPage
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'contact' && (
          <ContactPage
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'home' && (
          <Home 
            onNavigateTab={setCurrentTab}
            onPrefillPrompt={(prompt, modelId) => {
              setPrefilledPrompt(prompt);
              if (modelId) setPrefilledModelId(modelId);
              setCurrentTab('dispatch');
            }}
          />
        )}
      </main>

      {/* Modern Frosted Glass Footer with clickable navigation */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-slate-950/40 backdrop-blur-xl py-8 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
              <span className="text-white font-display font-semibold tracking-tight">WhyOr Dispatch</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">AI Multi-Model Routing Infrastructure</span>
            </div>

            {/* Quick Navigation Links */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="footer-nav-home"
                onClick={() => setCurrentTab('home')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'home' ? 'bg-orange-500/20 text-orange-300 font-bold border border-orange-400/30' : 'hover:text-white hover:bg-white/5'
                }`}
              >
                Overview
              </button>
              <button
                id="footer-nav-dispatch"
                onClick={() => setCurrentTab('dispatch')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'dispatch' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30' : 'hover:text-white hover:bg-white/5'
                }`}
              >
                Dispatch Console
              </button>
              <button
                id="footer-nav-pricing"
                onClick={() => setCurrentTab('pricing')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'pricing' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30' : 'hover:text-white hover:bg-white/5'
                }`}
              >
                Pricing & Trial
              </button>
              <button
                id="footer-nav-credentials"
                onClick={() => setCurrentTab('credentials')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'credentials' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30' : 'hover:text-white hover:bg-white/5'
                }`}
              >
                Company BYOK
              </button>
              <button
                id="footer-nav-analytics"
                onClick={() => setCurrentTab('analytics')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'analytics' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30' : 'hover:text-white hover:bg-white/5'
                }`}
              >
                Savings & Trends
              </button>
              <button
                id="footer-nav-ledger"
                onClick={() => setCurrentTab('ledger')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'ledger' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30' : 'hover:text-white hover:bg-white/5'
                }`}
              >
                Context Ledger
              </button>
              <button
                id="footer-nav-catalog"
                onClick={() => setCurrentTab('catalog')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'catalog' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30' : 'hover:text-white hover:bg-white/5'
                }`}
              >
                Models & Tools
              </button>
              <button
                id="footer-nav-teams"
                onClick={() => setCurrentTab('teams')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'teams' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30' : 'hover:text-white hover:bg-white/5'
                }`}
              >
                Team & Governance
              </button>
              <button
                id="footer-nav-contact"
                onClick={() => setCurrentTab('contact')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'contact' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30' : 'hover:text-white hover:bg-white/5'
                }`}
              >
                Contact Us
              </button>
              <button
                id="footer-nav-admin"
                onClick={() => setCurrentTab('admin')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'admin' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30' : 'hover:text-white hover:bg-white/5'
                }`}
              >
                Platform & Billing
              </button>
              <button
                id="footer-nav-research"
                onClick={() => setCurrentTab('research')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'research' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30' : 'hover:text-white hover:bg-white/5'
                }`}
              >
                Market Architecture
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 backdrop-blur-md">
                <Globe className="w-3 h-3" /> ai.whyor.in
              </span>
              <span className="text-slate-400">• 2-Stage Pre-Call Classifier</span>
              <span className="text-slate-400">• SHA-256 Context Ledger</span>
            </div>

            <div className="text-slate-500">
              Part of the WhyOr product suite. © 2026 WhyOr Technologies Inc.
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive 14-Endpoint FastAPI v1 Explorer Modal */}
      <ApiExplorerModal
        isOpen={isApiExplorerOpen}
        onClose={() => setIsApiExplorerOpen(false)}
        activePersona={activePersona}
      />
    </div>
  );
}
