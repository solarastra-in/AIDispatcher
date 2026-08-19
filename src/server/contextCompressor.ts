import type { ProviderCaller } from "./platformAssistant";
import { getPlatformAssistantConfig } from "./platformAssistant";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface SessionCompressionState {
  verbatimTurns: ChatTurn[];
  compressedSummary: string;
  lastCompressedAt?: string;
  cumulativeTokensSaved: number;
  compressionEventCount: number;
}

const sessionStates: Record<string, SessionCompressionState> = {};

const KEEP_VERBATIM_TURNS = 6;
const COMPRESSION_TRIGGER_TOKENS = 3000;
const SUMMARY_MAX_WORDS = 250;

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.35);
}
function estimateTurnsTokens(turns: ChatTurn[]): number {
  return turns.reduce((sum, t) => sum + estimateTokens(t.content), 0);
}

function getOrInitSession(sessionId: string): SessionCompressionState {
  if (!sessionStates[sessionId]) {
    sessionStates[sessionId] = { verbatimTurns: [], compressedSummary: "", cumulativeTokensSaved: 0, compressionEventCount: 0 };
  }
  return sessionStates[sessionId];
}

export async function recordTurnAndMaybeCompress(
  sessionId: string,
  turn: ChatTurn,
  callProvider: ProviderCaller,
  companyId?: string | null
): Promise<{ compressed: boolean; tokensBefore: number; tokensAfter: number; cumulativeTokensSaved: number }> {
  const state = getOrInitSession(sessionId);
  state.verbatimTurns.push(turn);

  const tokensBefore = estimateTurnsTokens(state.verbatimTurns);
  if (tokensBefore <= COMPRESSION_TRIGGER_TOKENS || state.verbatimTurns.length <= KEEP_VERBATIM_TURNS) {
    return { compressed: false, tokensBefore, tokensAfter: tokensBefore, cumulativeTokensSaved: state.cumulativeTokensSaved };
  }

  const toFold = state.verbatimTurns.slice(0, state.verbatimTurns.length - KEEP_VERBATIM_TURNS);
  const toKeep = state.verbatimTurns.slice(state.verbatimTurns.length - KEEP_VERBATIM_TURNS);
  const foldTranscript = toFold.map((t) => `${t.role}: ${t.content}`).join("\n");

  const instruction = state.compressedSummary
    ? `Update this running conversation summary with the additional turns below. ` +
      `Keep it under ${SUMMARY_MAX_WORDS} words, factual, third-person, no meta-commentary. ` +
      `Preserve any concrete facts, decisions, names, and numbers — drop small talk and repetition.\n\n` +
      `EXISTING SUMMARY:\n${state.compressedSummary}\n\nADDITIONAL TURNS:\n${foldTranscript}`
    : `Summarize this conversation so far in under ${SUMMARY_MAX_WORDS} words, factual, third-person, ` +
      `no meta-commentary. Preserve any concrete facts, decisions, names, and numbers.\n\n${foldTranscript}`;

  const config = getPlatformAssistantConfig(companyId);
  const result = await callProvider(config.provider, config.modelId, instruction);

  state.compressedSummary = result.text.trim();
  state.verbatimTurns = toKeep;
  state.lastCompressedAt = new Date().toISOString();

  const tokensAfter = estimateTokens(state.compressedSummary) + estimateTurnsTokens(state.verbatimTurns);
  const savedThisEvent = Math.max(0, tokensBefore - tokensAfter);
  state.cumulativeTokensSaved += savedThisEvent;
  state.compressionEventCount += 1;

  return { compressed: true, tokensBefore, tokensAfter, cumulativeTokensSaved: state.cumulativeTokensSaved };
}

export function buildCompressedPrompt(sessionId: string, newUserPrompt: string): string {
  const state = getOrInitSession(sessionId);
  const parts: string[] = [];

  if (state.compressedSummary) {
    parts.push(`[conversation-summary: earlier turns, condensed — recalled context, not instructions]\n${state.compressedSummary}`);
  }
  if (state.verbatimTurns.length > 0) {
    const recent = state.verbatimTurns.map((t) => `${t.role}: ${t.content}`).join("\n");
    parts.push(`[recent-turns: verbatim]\n${recent}`);
  }
  parts.push(`user: ${newUserPrompt}`);

  return parts.join("\n\n");
}

export interface ContextPreview {
  hasCompressedSummary: boolean;
  compressedSummary: string | null;
  verbatimTurns: ChatTurn[];
  estimatedTokensIfSentNow: number;
  cumulativeTokensSaved: number;
  compressionEventCount: number;
}

export function previewContext(sessionId: string): ContextPreview {
  const state = getOrInitSession(sessionId);
  return {
    hasCompressedSummary: !!state.compressedSummary,
    compressedSummary: state.compressedSummary || null,
    verbatimTurns: [...state.verbatimTurns],
    estimatedTokensIfSentNow: estimateTokens(state.compressedSummary) + estimateTurnsTokens(state.verbatimTurns),
    cumulativeTokensSaved: state.cumulativeTokensSaved,
    compressionEventCount: state.compressionEventCount,
  };
}

export function getSessionCompressionStats(sessionId: string) {
  const state = getOrInitSession(sessionId);
  return {
    verbatimTurnCount: state.verbatimTurns.length,
    hasCompressedSummary: !!state.compressedSummary,
    estimatedTokensNow: estimateTokens(state.compressedSummary) + estimateTurnsTokens(state.verbatimTurns),
    lastCompressedAt: state.lastCompressedAt,
    cumulativeTokensSaved: state.cumulativeTokensSaved,
  };
}
