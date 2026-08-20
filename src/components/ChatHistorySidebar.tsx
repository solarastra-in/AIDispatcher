import { useEffect, useState } from "react";
import { authedFetch } from "../lib/firebaseClient";
import { MessageSquare, Plus, RefreshCw, Clock, Bot, Trash2 } from "lucide-react";

interface ChatSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatHistorySidebar({
  activeSessionId,
  onSelectSession,
  onNewChat,
}: {
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}) {
  const [sessions, setSessions] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  function refresh() {
    authedFetch("/api/chat/sessions")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.sessions) ? data.sessions : [];
        setSessions(list);
        // If no active session is selected and sessions exist, auto-select the first one
        if (!activeSessionId && list.length > 0) {
          onSelectSession(list[0].id);
        }
      })
      .catch((err) => {
        console.warn("Failed to load chat history:", err);
        setSessions([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, [activeSessionId]);

  async function handleNewChat() {
    setIsCreating(true);
    try {
      const res = await authedFetch("/api/chat/sessions", {
        method: "POST",
        body: JSON.stringify({ title: `Chat ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}` }),
      });
      const session = await res.json();
      if (session && session.id) {
        onNewChat();
        onSelectSession(session.id);
        refresh();
      }
    } catch (e) {
      console.warn("Failed to create new chat session:", e);
      // Fallback local session ID
      const fallbackId = `session_${Date.now()}`;
      onNewChat();
      onSelectSession(fallbackId);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex flex-col gap-3 min-h-[480px]">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-orange-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            Chat Threads
          </h3>
        </div>
        <button
          onClick={refresh}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-md cursor-pointer"
          title="Refresh threads"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-orange-400" : ""}`} />
        </button>
      </div>

      <button
        onClick={handleNewChat}
        disabled={isCreating}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        <span>{isCreating ? "Starting Chat…" : "New Conversation"}</span>
      </button>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[460px]">
        {loading && sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2 font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
            <span>Loading history…</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs space-y-1">
            <Bot className="w-6 h-6 mx-auto text-slate-600 mb-2 opacity-50" />
            <p className="font-medium text-slate-400">No chats yet</p>
            <p className="text-[11px]">Click "New Conversation" above to start.</p>
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <button
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? "bg-orange-500/10 text-orange-300 border border-orange-500/30 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.8)]" : "bg-slate-700"}`} />
                  <span className="truncate block">{s.title || "Untitled Session"}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2 group-hover:text-slate-400">
                  {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' }) : ""}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500 text-center">
        WhyOr Adaptive Persistence
      </div>
    </div>
  );
}
