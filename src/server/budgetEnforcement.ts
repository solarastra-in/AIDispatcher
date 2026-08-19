import { budgets, budgetKey, type Budget } from "./orgModel";

export interface BudgetCheckResult {
  allowed: boolean;
  blockedBy: "user" | "team" | null;
  reason: string | null;
  userBudget: Budget | null;
  teamBudget: Budget | null;
}

function isExhausted(budget: Budget): { exhausted: boolean; reason: string | null } {
  if (budget.tokenLimit !== null && budget.tokensUsed >= budget.tokenLimit) {
    return { exhausted: true, reason: `Token budget exhausted (${budget.tokensUsed}/${budget.tokenLimit}).` };
  }
  if (budget.costLimitUsd !== null && budget.costUsedUsd >= budget.costLimitUsd) {
    return { exhausted: true, reason: `Cost budget exhausted ($${budget.costUsedUsd.toFixed(2)}/$${budget.costLimitUsd.toFixed(2)}).` };
  }
  return { exhausted: false, reason: null };
}

export function checkBudget(userId: string, teamId: string | null): BudgetCheckResult {
  const userBudget = budgets[budgetKey("user", userId)] ?? null;
  const teamBudget = teamId ? (budgets[budgetKey("team", teamId)] ?? null) : null;

  if (userBudget) {
    const check = isExhausted(userBudget);
    if (check.exhausted) {
      return { allowed: false, blockedBy: "user", reason: check.reason, userBudget, teamBudget };
    }
  }
  if (teamBudget) {
    const check = isExhausted(teamBudget);
    if (check.exhausted) {
      return { allowed: false, blockedBy: "team", reason: check.reason, userBudget, teamBudget };
    }
  }
  return { allowed: true, blockedBy: null, reason: null, userBudget, teamBudget };
}

export function recordUsage(userId: string, teamId: string | null, tokensUsed: number, costUsd: number): void {
  const uKey = budgetKey("user", userId);
  if (budgets[uKey]) {
    budgets[uKey].tokensUsed += tokensUsed;
    budgets[uKey].costUsedUsd += costUsd;
  }
  if (teamId) {
    const tKey = budgetKey("team", teamId);
    if (budgets[tKey]) {
      budgets[tKey].tokensUsed += tokensUsed;
      budgets[tKey].costUsedUsd += costUsd;
    }
  }
}

export function setBudget(
  scopeType: "user" | "team",
  scopeId: string,
  tokenLimit: number | null,
  costLimitUsd: number | null
): Budget {
  const key = budgetKey(scopeType, scopeId);
  const existing = budgets[key];
  const updated: Budget = {
    scopeType,
    scopeId,
    periodStart: existing?.periodStart ?? new Date().toISOString(),
    tokenLimit,
    costLimitUsd,
    tokensUsed: existing?.tokensUsed ?? 0,
    costUsedUsd: existing?.costUsedUsd ?? 0,
  };
  budgets[key] = updated;
  return updated;
}

export function resetBudgetPeriod(scopeType: "user" | "team", scopeId: string): Budget | null {
  const key = budgetKey(scopeType, scopeId);
  const existing = budgets[key];
  if (!existing) return null;
  existing.periodStart = new Date().toISOString();
  existing.tokensUsed = 0;
  existing.costUsedUsd = 0;
  return existing;
}
