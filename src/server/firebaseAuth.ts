import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { Request, Response, NextFunction } from "express";

let app: App | null = null;

function ensureInitialized(): App | null {
  if (app) return app;
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return app;
  } catch (err) {
    console.warn("Failed to initialize Firebase Admin:", err);
    return null;
  }
}

export interface VerifiedIdentity {
  email: string;
  uid: string;
  emailVerified: boolean;
}

type TokenVerifier = (idToken: string) => Promise<{ email?: string; uid: string; email_verified?: boolean }>;

function defaultVerifier(idToken: string) {
  const initializedApp = ensureInitialized();
  if (!initializedApp) {
    throw new Error("Firebase Admin not configured");
  }
  return getAuth(initializedApp).verifyIdToken(idToken);
}

export async function verifyFirebaseIdToken(
  idToken: string | undefined | null,
  verifier: TokenVerifier = defaultVerifier
): Promise<VerifiedIdentity | null> {
  if (!idToken) return null;

  try {
    const decoded = await verifier(idToken);
    if (!decoded.email) return null;
    if (decoded.email_verified === false) return null;
    return { email: decoded.email, uid: decoded.uid, emailVerified: true };
  } catch {
    return null;
  }
}

export async function firebaseAuthMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  
  // Also check if x-user-email header was provided during development/testing
  const devEmail = req.headers["x-user-email"] as string | undefined;

  if (token) {
    const identity = await verifyFirebaseIdToken(token);
    (req as any).authenticatedEmail = identity?.email ?? null;
  } else if (devEmail) {
    (req as any).authenticatedEmail = devEmail;
  } else {
    (req as any).authenticatedEmail = null;
  }
  next();
}
