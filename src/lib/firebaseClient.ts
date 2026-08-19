import { auth, signInWithGoogle as originalSignInWithGoogle, signOutUser, onAuthChanged } from "./firebase";
import type { User } from "firebase/auth";

export { auth };

export async function signInWithGoogle(): Promise<User> {
  const result = await originalSignInWithGoogle();
  return result.user;
}

export async function signOut(): Promise<void> {
  await signOutUser();
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthChanged(callback);
}

export async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getIdToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // If user is currently signed in, also set x-user-email as a fallback header
  if (auth.currentUser?.email) {
    headers.set("x-user-email", auth.currentUser.email);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...options, headers });
}
