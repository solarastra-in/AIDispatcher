import { useEffect, useState } from "react";
import { authedFetch } from "../lib/firebaseClient";

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

  function refresh() {
    authedFetch("/api/chat/sessions")
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [activeSessionId]);

  async function handleNewChat() {
    try {
      const res = await authedFetch("/api/chat/sessions", { method: "POST" });
      const session = await res.json();
      if (session && session.id) {
        onNewChat();
        onSelectSession(session.id);
        refresh();
      }
    } catch (e) {
      console.warn("Failed to create new chat:", e);
    }
  }

  return (
    <div className="w-56 border-r border-[#2A2F38] p-3 flex flex-col gap-2 bg-[#12151B]">
      <button
        onClick={handleNewChat}
        className="text-xs px-3 py-2 bg-[#FF8A3D] text-[#171208] rounded font-medium text-left hover:bg-[#ffa15e] cursor-pointer"
      >
        + New chat
      </button>

      {loading ? (
        <p className="text-[11px] text-[#5B6169] px-1">Loading history…</p>
      ) : sessions.length === 0 ? (
        <p className="text-[11px] text-[#5B6169] px-1">No chats yet.</p>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className={`text-left text-xs px-2 py-2 rounded truncate cursor-pointer ${
                s.id === activeSessionId ? "bg-[#1D222A] text-[#E7E9EC]" : "text-[#93999F] hover:bg-[#171B21]"
              }`}
              title={s.title}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
