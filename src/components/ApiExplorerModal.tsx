import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Shield, 
  Copy, 
  Check, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { API_ENDPOINTS, ApiEndpointDefinition, apiService, ApiResponse } from '../core/apiSurface';
import { UserPersona } from '../types';

interface ApiExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: UserPersona;
}

export const ApiExplorerModal: React.FC<ApiExplorerModalProps> = ({
  isOpen,
  onClose,
  activePersona,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpointDefinition>(API_ENDPOINTS[0]);
  const [requestBodyText, setRequestBodyText] = useState<string>(
    JSON.stringify(API_ENDPOINTS[0].sampleRequestBody || {}, null, 2)
  );
  const [activeTab, setActiveTab] = useState<'response' | 'curl' | 'docs'>('response');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [responseOutput, setResponseOutput] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectEndpoint = (ep: ApiEndpointDefinition) => {
    setSelectedEndpoint(ep);
    setRequestBodyText(JSON.stringify(ep.sampleRequestBody || {}, null, 2));
    setResponseOutput(null);
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    let parsedBody: any = undefined;
    if (selectedEndpoint.method !== 'GET' && requestBodyText.trim()) {
      try {
        parsedBody = JSON.parse(requestBodyText);
      } catch (e) {
        setResponseOutput({
          status: 400,
          data: { error: 'Invalid JSON', message: 'Malformed JSON payload in request body' },
          headers: {},
          latencyMs: 2,
          timestamp: new Date().toISOString()
        });
        setIsExecuting(false);
        return;
      }
    }

    try {
      const res = await apiService.executeEndpoint(
        selectedEndpoint.method,
        selectedEndpoint.path,
        activePersona,
        parsedBody
      );
      setResponseOutput(res);
    } catch (err: any) {
      setResponseOutput({
        status: 500,
        data: { error: 'Internal Server Error', message: err.message },
        headers: {},
        latencyMs: 15,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const curlCommand = `curl -X ${selectedEndpoint.method} "https://ai.whyor.in${selectedEndpoint.path}" \\
  -H "Authorization: Bearer whyor_${activePersona.role}_token" \\
  -H "Content-Type: application/json" \\
  -H "X-Caller-Role: ${activePersona.role}"${selectedEndpoint.method !== 'GET' ? ` \\\n  -d '${requestBodyText.replace(/\n\s*/g, ' ')}'` : ''}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">WhyOr Dispatch API Surface (FastAPI v1)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  ai.whyor.in v0.1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Interactive REST surface & simulated live endpoints across all 5 RBAC personas.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Caller:</span>
              <span className="text-amber-300 font-bold">{activePersona.name} ({activePersona.role})</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Split */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left: Endpoint List */}
          <div className="md:col-span-4 border-r border-white/10 bg-slate-950/40 p-3 overflow-y-auto max-h-[70vh] space-y-1.5 font-mono text-xs">
            <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>All 14 Endpoints</span>
              <span className="text-[10px] text-cyan-400">FastAPI</span>
            </div>

            {API_ENDPOINTS.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              const isAllowed = ep.personasAllowed.some(p => p.toLowerCase().replace(/\s+/g, '_') === activePersona.role || p === 'Guest');

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-400/40 shadow-sm'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        ep.method === 'POST' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' :
                        ep.method === 'PATCH' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      }`}>
                        {ep.method}
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[170px]" title={ep.path}>
                        {ep.path}
                      </span>
                    </div>
                    {!isAllowed && (
                      <span className="text-[9px] text-red-400 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">403</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 font-sans">
                    {ep.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: Interactive Console */}
          <div className="md:col-span-8 flex flex-col bg-slate-900/60 overflow-hidden">
            
            {/* Action Bar */}
            <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-950/20">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-md text-xs font-bold font-mono ${
                  selectedEndpoint.method === 'POST' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' :
                  selectedEndpoint.method === 'PATCH' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                }`}>
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-xs sm:text-sm text-white font-semibold">{selectedEndpoint.path}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="execute-api-btn"
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 border border-cyan-400/30 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isExecuting ? 'Sending...' : 'Send Request'}</span>
                </button>
              </div>
            </div>

            {/* Request & Response Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              
              {/* Endpoint Documentation Box */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-1.5">
                <p className="text-slate-300 leading-relaxed font-sans">{selectedEndpoint.description}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px] text-slate-400">
                  <span>Authorized Personas:</span>
                  {selectedEndpoint.personasAllowed.map((p, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Request Payload Editor (if not GET) */}
              {selectedEndpoint.method !== 'GET' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs font-mono text-slate-400">
                    <span>Request Body (JSON):</span>
                    <button
                      onClick={() => setRequestBodyText(JSON.stringify(selectedEndpoint.sampleRequestBody || {}, null, 2))}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Reset Sample
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={requestBodyText}
                    onChange={(e) => setRequestBodyText(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400/60 resize-y"
                  />
                </div>
              )}

              {/* Tabs: Response / cURL */}
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('response')}
                      className={`font-semibold transition-all cursor-pointer ${
                        activeTab === 'response' ? 'text-cyan-300 border-b-2 border-cyan-400 pb-1' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Live Response {responseOutput && `(${responseOutput.status})`}
                    </button>
                    <button
                      onClick={() => setActiveTab('curl')}
                      className={`font-semibold transition-all cursor-pointer ${
                        activeTab === 'curl' ? 'text-cyan-300 border-b-2 border-cyan-400 pb-1' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      cURL Command
                    </button>
                  </div>

                  <button
                    onClick={() => copyToClipboard(activeTab === 'curl' ? curlCommand : JSON.stringify(responseOutput?.data || {}, null, 2))}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {activeTab === 'response' && (
                  <div>
                    {responseOutput ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              responseOutput.status === 200 || responseOutput.status === 201
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                : responseOutput.status === 403
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                : 'bg-red-500/20 text-red-300 border border-red-400/30'
                            }`}>
                              HTTP {responseOutput.status}
                            </span>
                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {responseOutput.latencyMs}ms
                            </span>
                          </div>
                          <span className="text-slate-500 text-[10px]">{responseOutput.timestamp}</span>
                        </div>

                        <pre className="p-4 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[220px] whitespace-pre-wrap leading-relaxed">
                          {JSON.stringify(responseOutput.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="p-8 rounded-xl bg-slate-950/60 border border-dashed border-white/10 text-center text-xs font-mono text-slate-500">
                        Click "Send Request" above to execute this endpoint with active authentication.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'curl' && (
                  <pre className="p-4 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-amber-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {curlCommand}
                  </pre>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
