import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Activity, 
  Cpu, 
  CheckCircle2, 
  ShieldCheck,
  CornerDownLeft,
  RefreshCw
} from 'lucide-react';
import { TerminalSessionCommandResult } from '../types';

interface ClaudeCliTerminalProps {
  subscriptionEmail?: string;
  subscriptionTier?: string;
  isProxyActive?: boolean;
}

export const ClaudeCliTerminal: React.FC<ClaudeCliTerminalProps> = ({
  subscriptionEmail = 'solarastra.in@gmail.com',
  subscriptionTier = 'Claude 3.7 Max / CLI Unlimited ($20/mo Flat)',
  isProxyActive = true,
}) => {
  const [commandInput, setCommandInput] = useState<string>('claude auth status');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [history, setHistory] = useState<TerminalSessionCommandResult[]>([
    {
      command: 'claude auth status',
      stdout: `✓ Authenticated as: ${subscriptionEmail}\n✓ Active Organization: Acme Enterprises AI Lab (org_enterprise_8892)\n✓ Subscription Tier: ${subscriptionTier}\n✓ Rate Limit Mode: Flat Subscription (Unlimited CLI Access)\n✓ Local Proxy Bridge: http://localhost:8083/v1 (PID: 49120 - Active)\n✓ Session Token: claude-cli-tok_44...719 [Valid until 2026-09-15]`,
      exitCode: 0,
      durationMs: 65,
      sessionTier: 'Claude 3.7 Max CLI',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const handleExecute = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || commandInput).trim();
    if (!cmd) return;

    setIsExecuting(true);
    try {
      const res = await fetch('/api/credentials/subscription/cli-exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      if (data.success) {
        setHistory(prev => [
          ...prev,
          {
            command: data.command,
            stdout: data.stdout,
            exitCode: data.exitCode || 0,
            durationMs: data.durationMs || 120,
            sessionTier: data.sessionTier || 'Claude 3.7 Max CLI',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } else {
        setHistory(prev => [
          ...prev,
          {
            command: cmd,
            stdout: `[Error ${data.error || 'Execution failed'}]`,
            stderr: data.error,
            exitCode: 1,
            durationMs: 45,
            sessionTier: 'Claude 3.7 Max CLI',
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (err: any) {
      setHistory(prev => [
        ...prev,
        {
          command: cmd,
          stdout: `[Network Error: ${err.message}]`,
          stderr: err.message,
          exitCode: 1,
          durationMs: 20,
          sessionTier: 'Claude 3.7 Max CLI',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsExecuting(false);
      setCommandInput('');
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickCommands = [
    { label: 'auth status', cmd: 'claude auth status' },
    { label: 'version check', cmd: 'claude --version' },
    { label: 'code audit', cmd: 'claude -p "Audit context ledger hash chain consistency in server.ts"' },
    { label: 'ast optimize', cmd: 'claude -p "Minify TypeScript AST representation for router"' },
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="font-mono text-slate-400 font-medium ml-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            claude-cli terminal session &mdash; bash (daemon pid 49120)
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Subscription Active ($0.00/token)</span>
          </div>

          <button
            onClick={() => setHistory([])}
            className="text-slate-400 hover:text-slate-200 p-1 transition-colors"
            title="Clear terminal output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Session Badges */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            OAuth Session: <strong className="text-slate-200">{subscriptionEmail}</strong>
          </span>
          <span>•</span>
          <span className="text-amber-400 font-medium">{subscriptionTier}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-mono">Quick CLI:</span>
          {quickCommands.map((qc, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCommandInput(qc.cmd);
                handleExecute(qc.cmd);
              }}
              disabled={isExecuting}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700 transition-colors"
            >
              {qc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="p-4 max-h-80 overflow-y-auto font-mono text-xs text-slate-200 space-y-4 select-text">
        {history.length === 0 && (
          <div className="text-slate-500 italic">
            Terminal ready. Type a `claude` CLI command or select a quick action above. All operations run under your flat-rate subscription without per-token charges.
          </div>
        )}

        {history.map((item, idx) => (
          <div key={idx} className="space-y-1.5 group">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">$</span>
                <span className="text-slate-100 font-semibold">{item.command}</span>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-slate-500">{item.durationMs}ms</span>
                <span className="text-slate-500">{item.timestamp}</span>
                <button
                  onClick={() => handleCopy(item.stdout, idx)}
                  className="p-1 hover:text-slate-200 text-slate-400"
                  title="Copy Output"
                >
                  {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed">
              {item.stdout}
            </div>
          </div>
        ))}

        {isExecuting && (
          <div className="flex items-center space-x-2 text-amber-400 text-xs py-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Executing interactive Claude CLI daemon request...</span>
          </div>
        )}
      </div>

      {/* Terminal Input Bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <span className="text-emerald-400 font-mono font-bold text-sm pl-1">$</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleExecute();
            }
          }}
          placeholder="claude -p 'Your task here...' or claude auth status"
          className="flex-1 bg-transparent border-0 font-mono text-xs text-slate-100 focus:outline-none focus:ring-0 placeholder-slate-600"
        />
        <button
          onClick={() => handleExecute()}
          disabled={isExecuting || !commandInput.trim()}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold rounded text-xs flex items-center gap-1.5 transition-all shadow-sm"
        >
          {isExecuting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CornerDownLeft className="w-3.5 h-3.5" />
          )}
          <span>Run</span>
        </button>
      </div>
    </div>
  );
};
