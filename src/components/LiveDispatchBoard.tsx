import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Pause, Play, Plus, Activity, Clock, DollarSign } from 'lucide-react';

interface DispatchItem {
  id: string;
  prompt: string;
  model: string;
  tier: string;
  save: string;
  status: string;
  latencyMs: number;
  timestamp: string;
}

const POOL_ROWS: DispatchItem[] = [
  { id: '#4471', prompt: 'Summarize quarterly investor update', model: 'Gemini 3.7 Flash', tier: 'low', save: '1,180 tok ($0.0052)', status: 'ROUTED', latencyMs: 220, timestamp: 'just now' },
  { id: '#4472', prompt: 'Extract line items from lease PDF', model: 'Claude 3.5 Haiku', tier: 'low', save: '2,040 tok ($0.0094)', status: 'ROUTED', latencyMs: 280, timestamp: 'just now' },
  { id: '#4473', prompt: 'Draft tenant renewal notice', model: 'GPT-4o Mini', tier: 'low', save: '640 tok ($0.0031)', status: 'ROUTED', latencyMs: 295, timestamp: 'just now' },
  { id: '#4474', prompt: 'Synthesize hail-claim risk memo', model: 'Claude 3.7 Sonnet', tier: 'high', save: 'escalated to high tier', status: 'ROUTED', latencyMs: 910, timestamp: 'just now' },
  { id: '#4475', prompt: 'Classify support ticket urgency', model: 'Groq Llama 3.3', tier: 'low', save: '2,310 tok ($0.0112)', status: 'ROUTED', latencyMs: 98, timestamp: 'just now' },
  { id: '#4476', prompt: 'PostgreSQL Index & Partitioning logic', model: 'DeepSeek-V3', tier: 'low', save: '3,840 tok ($0.0182)', status: 'ROUTED', latencyMs: 340, timestamp: 'just now' },
  { id: '#4477', prompt: 'Pareto LLM dispatch mathematical proof', model: 'Gemini 3.1 Pro', tier: 'frontier', save: 'escalated to frontier', status: 'ROUTED', latencyMs: 840, timestamp: 'just now' },
  { id: '#4478', prompt: 'Convert curl script to TypeScript fetch API', model: 'Gemini 3.7 Flash', tier: 'low', save: '920 tok ($0.0041)', status: 'ROUTED', latencyMs: 210, timestamp: 'just now' },
  { id: '#4479', prompt: 'Audit GDPR data retention compliance in SQL', model: 'Claude 3.5 Sonnet', tier: 'high', save: '3,100 tok ($0.0152)', status: 'ROUTED', latencyMs: 780, timestamp: 'just now' },
  { id: '#4480', prompt: 'Generate SEO meta titles and OpenGraph tags', model: 'Mistral Small 3', tier: 'low', save: '540 tok ($0.0022)', status: 'ROUTED', latencyMs: 190, timestamp: 'just now' },
];

export const LiveDispatchBoard: React.FC = () => {
  const [rows, setRows] = useState<DispatchItem[]>(POOL_ROWS.slice(0, 5));
  const [tickerIndex, setTickerIndex] = useState(5);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(3000);
  const [totalProcessedCount, setTotalProcessedCount] = useState<number>(4480);
  const [totalSavingsAccumulated, setTotalSavingsAccumulated] = useState<number>(14280.50);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const baseItem = POOL_ROWS[tickerIndex % POOL_ROWS.length];
      const newId = `#${totalProcessedCount + 1}`;
      const nextItem: DispatchItem = {
        ...baseItem,
        id: newId,
        latencyMs: Math.max(80, Math.floor(baseItem.latencyMs + (Math.random() * 80 - 40))),
        timestamp: 'just now',
      };

      setRows((prev) => [nextItem, ...prev.slice(0, 4)]);
      setTickerIndex((i) => i + 1);
      setTotalProcessedCount((c) => c + 1);
      setTotalSavingsAccumulated((s) => s + (Math.random() * 0.015 + 0.004));
    }, streamSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, tickerIndex, streamSpeed, totalProcessedCount]);

  const handleInjectBurst = () => {
    const burstItems: DispatchItem[] = [
      { id: `#${totalProcessedCount + 1}`, prompt: 'Burst test: Parallel JSON entity parsing', model: 'Groq Llama 3.3', tier: 'low', save: '1,890 tok ($0.0085)', status: 'ROUTED', latencyMs: 95, timestamp: 'burst' },
      { id: `#${totalProcessedCount + 2}`, prompt: 'Burst test: Regex token compression check', model: 'Gemini 3.7 Flash', tier: 'low', save: '2,420 tok ($0.0110)', status: 'ROUTED', latencyMs: 180, timestamp: 'burst' },
      { id: `#${totalProcessedCount + 3}`, prompt: 'Burst test: Deep multi-turn context audit', model: 'Claude 3.7 Sonnet', tier: 'high', save: '3,800 tok ($0.0190)', status: 'ROUTED', latencyMs: 820, timestamp: 'burst' },
    ];
    setRows((prev) => [...burstItems, ...prev.slice(0, 2)]);
    setTotalProcessedCount((c) => c + 3);
    setTotalSavingsAccumulated((s) => s + 0.0385);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 bg-white/[0.04] border-b border-white/[0.08] font-mono text-xs gap-3">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white tracking-wide">LIVE DISPATCH TELEMETRY STREAM</span>
          <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 hidden md:inline">
            Total Streamed: {totalProcessedCount.toLocaleString()} reqs
          </span>
        </div>

        {/* Stream Controls */}
        <div className="flex items-center gap-2">
          {/* Pause / Resume Button */}
          <button
            id="stream-pause-play-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer text-[11px]"
            title={isPlaying ? "Pause Stream" : "Resume Stream"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 text-amber-400" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-emerald-400" />
                <span>Resume</span>
              </>
            )}
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5 text-[10px]">
            <button
              onClick={() => setStreamSpeed(4000)}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${streamSpeed === 4000 ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              1x
            </button>
            <button
              onClick={() => setStreamSpeed(2000)}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${streamSpeed === 2000 ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              2x
            </button>
            <button
              onClick={() => setStreamSpeed(1000)}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${streamSpeed === 1000 ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              3x
            </button>
          </div>

          {/* Inject Burst Button */}
          <button
            id="stream-inject-burst-btn"
            onClick={handleInjectBurst}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/20 transition-all cursor-pointer text-[11px]"
          >
            <Plus className="w-3 h-3" />
            <span>Burst Test</span>
          </button>

          <div className="flex items-center gap-1.5 text-cyan-400 font-medium pl-1">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]' : 'bg-slate-500'}`} />
            <span className="text-[10px] tracking-wider">{isPlaying ? 'LIVE' : 'PAUSED'}</span>
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-5 py-2.5 border-b border-white/[0.06] font-mono text-[11px] text-slate-400 uppercase tracking-wider bg-white/[0.02]">
        <div className="sm:col-span-5">Incoming Prompt</div>
        <div className="sm:col-span-3">Optimal Model Routed</div>
        <div className="sm:col-span-3">Token Economics Saved</div>
        <div className="sm:col-span-1 text-right">Status</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/[0.05]">
        {rows.map((row, idx) => {
          const isFrontier = row.tier === 'frontier' || row.tier === 'deep_reasoning';
          return (
            <div
              key={`${row.id}-${idx}`}
              className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-2 px-5 py-3.5 font-mono text-xs transition-all hover:bg-white/[0.06] items-center animate-in fade-in duration-300"
            >
              <div className="sm:col-span-5 flex items-center gap-2.5 min-w-0">
                <span className="text-slate-500 text-[11px] shrink-0 font-bold">{row.id}</span>
                <span className="text-slate-100 truncate font-sans text-xs">{row.prompt}</span>
              </div>
              <div className="sm:col-span-3 flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold backdrop-blur-md ${
                  isFrontier 
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.15)]' 
                    : 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                }`}>
                  {row.model}
                </span>
                <span className="text-[10px] text-slate-400 hidden md:inline font-mono">({row.latencyMs}ms)</span>
              </div>
              <div className="sm:col-span-3 text-[11px] text-slate-300">
                {row.save.includes('escalated') ? (
                  <span className="text-amber-300 font-medium">Frontier Verified</span>
                ) : (
                  <span>
                    Saved <strong className="text-white font-semibold">{row.save}</strong>
                  </span>
                )}
              </div>
              <div className="sm:col-span-1 text-left sm:text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-2 py-0.5 rounded-full backdrop-blur-md">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {row.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
