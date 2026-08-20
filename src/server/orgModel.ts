export type OrgRole = "super_admin" | "company_admin" | "team_member";

export interface UserAccount {
  id: string;
  email: string;
  displayName?: string;
  role: OrgRole;
  companyId: string | null;      // null only for super_admin
  teamId: string | null;         // null for company_admin (company-wide) and super_admin
  privileges: {
    canSelectModel: boolean;     // can override auto-routing and pick a specific engine/model
  };
  createdAt: string;
  createdByUserId: string | null; // who onboarded this account
}

export interface Company {
  id: string;
  name: string;
  ssoDomain?: string;             // e.g. "acme.com" — anyone authenticating via this domain's SSO is auto-scoped here
  seededGmailAddresses: string[]; // explicit allowlist for teams without SSO — seeded by super_admin or company_admin
  createdAt: string;
  createdByUserId: string;        // must be a super_admin
}

export interface Team {
  id: string;
  companyId: string;
  name: string;
  allowedModelIds: string[] | null; // null = no restriction; non-null = ONLY these models are usable, all others excluded with reason "admin_enforced"
  createdAt: string;
}

export interface Budget {
  scopeType: "user" | "team";
  scopeId: string;                // userId or teamId
  periodStart: string;             // ISO date — budgets reset per period (monthly, set by company_admin)
  tokenLimit: number | null;       // null = unlimited
  costLimitUsd: number | null;     // null = unlimited
  tokensUsed: number;
  costUsedUsd: number;
}

// ---- in-memory stores ----
export const companies: Record<string, Company> = {};
export const teams: Record<string, Team> = {};
export const users: Record<string, UserAccount> = {}; // keyed by user id
export const usersByEmail: Record<string, string> = {}; // email -> user id, for login lookup
export const budgets: Record<string, Budget> = {}; // keyed by `${scopeType}:${scopeId}`

export function budgetKey(scopeType: "user" | "team", scopeId: string): string {
  return `${scopeType}:${scopeId}`;
}

export function getUserByEmail(email: string): UserAccount | undefined {
  const id = usersByEmail[email.toLowerCase()];
  return id ? users[id] : undefined;
}

export function createUser(input: Omit<UserAccount, "id" | "createdAt">): UserAccount {
  const id = `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const user: UserAccount = { ...input, id, createdAt: new Date().toISOString() };
  users[id] = user;
  usersByEmail[input.email.toLowerCase()] = id;
  return user;
}
