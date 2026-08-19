import type { Request } from "express";
import { getUserByEmail, type UserAccount } from "./orgModel";

const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || "solarastra.in@gmail.com").toLowerCase();

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === SUPER_ADMIN_EMAIL;
}

export function isCompanyAdmin(user: UserAccount | undefined): boolean {
  return !!user && user.role === "company_admin";
}

export function isSuperAdminOrCompanyAdmin(user: UserAccount | undefined): boolean {
  return !!user && (user.role === "super_admin" || user.role === "company_admin");
}

export function canViewSuperAdminConsole(email: string | null | undefined): boolean {
  return isSuperAdminEmail(email);
}

export function canViewCompanyAdminConsole(email: string | null | undefined): boolean {
  if (isSuperAdminEmail(email)) return true;
  const user = email ? getUserByEmail(email) : undefined;
  return isCompanyAdmin(user);
}

/**
 * Reads the email that firebaseAuthMiddleware verified and attached to the request.
 * Returns null for an unauthenticated request.
 */
export function resolveAuthenticatedEmail(req: Request): string | null {
  return (req as any).authenticatedEmail ?? null;
}
