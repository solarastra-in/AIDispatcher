import { useEffect, useState } from "react";
import { signInWithGoogle, signOut, onAuthChange } from "../lib/firebaseClient";
import type { User } from "firebase/auth";

export default function GoogleSignInButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className="text-[#93999F] font-mono">{user.email}</span>
        <button onClick={() => signOut()} className="text-[#5B6169] hover:text-[#E7E9EC] cursor-pointer">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signInWithGoogle().catch((e) => console.error("Sign-in failed:", e))}
      className="text-xs px-3 py-1.5 border border-[#2A2F38] rounded hover:border-[#93999F] text-[#93999F] hover:text-[#E7E9EC] cursor-pointer"
    >
      Sign in with Google
    </button>
  );
}
