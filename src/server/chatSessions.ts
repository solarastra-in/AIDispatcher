export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  modelUsed?: string;
  providerUsed?: string;
  tokensUsed?: number;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

const sessions: Record<string, ChatSession> = {};
const sessionsByUser: Record<string, string[]> = {};

export function createChatSession(userId: string): ChatSession {
  const id = `chat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const session: ChatSession = { id, userId, title: "New chat", createdAt: now, updatedAt: now, messages: [] };
  sessions[id] = session;
  sessionsByUser[userId] = [...(sessionsByUser[userId] || []), id];
  return session;
}

export function getChatSession(sessionId: string): ChatSession | undefined {
  return sessions[sessionId];
}

export function listChatSessionsForUser(userId: string): Array<Pick<ChatSession, "id" | "title" | "createdAt" | "updatedAt">> {
  const ids = sessionsByUser[userId] || [];
  return ids
    .map((id) => sessions[id])
    .filter(Boolean)
    .map((s) => ({ id: s.id, title: s.title, createdAt: s.createdAt, updatedAt: s.updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function appendMessage(sessionId: string, message: Omit<ChatMessage, "id" | "createdAt">): ChatMessage {
  const session = sessions[sessionId];
  if (!session) throw new Error(`No chat session '${sessionId}'`);

  const fullMessage: ChatMessage = { ...message, id: `msg_${Date.now().toString(36)}`, createdAt: new Date().toISOString() };
  session.messages.push(fullMessage);
  session.updatedAt = fullMessage.createdAt;

  if (session.title === "New chat" && message.role === "user") {
    session.title = message.content.slice(0, 60) + (message.content.length > 60 ? "…" : "");
  }
  return fullMessage;
}

export function verifySessionOwnership(sessionId: string, userId: string): boolean {
  return sessions[sessionId]?.userId === userId;
}
