"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  ApiError,
  clearSession,
  readSession,
  saveSession,
  SESSION_EVENT,
  sessionFromHash,
  type Profile,
  type Session,
} from "@/lib/api";
import type { SapAccount } from "@/lib/auth";

type AuthContextValue = {
  /** The signed-in user's profile in the shape the account pages use. */
  account: SapAccount | null;
  profile: Profile | null;
  /** True once the stored session (if any) has been checked. */
  ready: boolean;
  /** Start a session returned by sign-in or an e-mail link. */
  startSession: (session: Session, keepSignedIn?: boolean) => Promise<Profile | null>;
  /** Save edited profile fields (Manage my account). */
  signIn: (account: SapAccount) => Promise<void>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<Profile | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const PROFILE_KEY = "sap-clone-profile";

export function toAccount(profile: Profile): SapAccount {
  const first = profile.first_name || profile.email.split("@")[0];
  return {
    email: profile.email,
    firstName: first,
    lastName: profile.last_name,
    displayName: profile.display_name || `${first} ${profile.last_name}`.trim(),
    country: profile.country,
    company: profile.company,
    department: profile.department,
    relationship: profile.relationship,
    phone: profile.phone,
  };
}

function cachedProfile(): Profile | null {
  if (typeof window === "undefined" || !readSession()) return null;
  try {
    const raw = window.sessionStorage.getItem(PROFILE_KEY) || window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function cacheProfile(profile: Profile | null) {
  try {
    if (profile) window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    else {
      window.localStorage.removeItem(PROFILE_KEY);
      window.sessionStorage.removeItem(PROFILE_KEY);
    }
    // Drop the old, unauthenticated demo account from earlier versions.
    window.localStorage.removeItem("sap-clone-account");
    window.localStorage.removeItem("sapAccountEmail");
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const reloadProfile = useCallback(async () => {
    if (!readSession()) {
      setProfile(null);
      cacheProfile(null);
      return null;
    }
    try {
      const me = await api<{ profile: Profile }>("/auth/me", { auth: true });
      setProfile(me.profile);
      cacheProfile(me.profile);
      return me.profile;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        setProfile(null);
        cacheProfile(null);
      }
      return null;
    }
  }, []);

  // Restore the stored session; pick up a session from a Supabase e-mail
  // link (it lands with #access_token=... on whatever page it was sent to).
  useEffect(() => {
    const fromLink = sessionFromHash(window.location.hash);
    if (fromLink) {
      saveSession(fromLink, true);
      const clean = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", clean);
      if (fromLink.type === "recovery" && window.location.pathname !== "/reset-password") {
        router.replace("/reset-password?link=1");
      } else if (
        fromLink.type !== "recovery" &&
        window.location.pathname !== "/verify-email"
      ) {
        router.replace("/verify-email?confirmed=1");
      }
    }
    setProfile(cachedProfile());
    reloadProfile().finally(() => setReady(true));

    const onChange = () => {
      if (!readSession()) setProfile(null);
    };
    window.addEventListener(SESSION_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(SESSION_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [reloadProfile, router]);

  const startSession = useCallback(
    async (session: Session, keepSignedIn?: boolean) => {
      saveSession(session, keepSignedIn);
      return reloadProfile();
    },
    [reloadProfile]
  );

  const signIn = useCallback(async (next: SapAccount) => {
    const updated = await api<Profile>("/profile", {
      method: "PATCH",
      auth: true,
      body: {
        first_name: next.firstName,
        last_name: next.lastName,
        display_name: next.displayName,
        country: next.country,
        company: next.company,
        department: next.department,
        relationship: next.relationship,
        phone: next.phone,
      },
    });
    setProfile(updated);
    cacheProfile(updated);
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (readSession()) await api("/auth/signout", { method: "POST", auth: true });
    } catch {
      // Forget the session locally even if the server can't be reached.
    }
    clearSession();
    cacheProfile(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      account: profile ? toAccount(profile) : null,
      profile,
      ready,
      startSession,
      signIn,
      signOut,
      reloadProfile,
    }),
    [profile, ready, startSession, signIn, signOut, reloadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
