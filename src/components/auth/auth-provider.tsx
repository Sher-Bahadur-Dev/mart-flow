"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getAuth, isFirebaseClientConfigured } from "@/lib/firebase/config";
import {
  registerOwner,
  requestPasswordReset,
  signInStaff,
  signOutStaff,
} from "@/services/auth";
import { getUserProfile } from "@/services/users";
import type { UserProfile } from "@/types";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  configured: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(uid: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const profile = await getUserProfile(uid);
    if (profile) {
      return profile;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(() => isFirebaseClientConfigured());

  useEffect(() => {
    if (!isFirebaseClientConfigured()) {
      let cancelled = false;
      void Promise.resolve().then(() => {
        if (cancelled) {
          return;
        }
        setIsConfigured(false);
        setUser(null);
        setProfile(null);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    const auth = getAuth();
    return onAuthStateChanged(auth, async (nextUser) => {
      setIsConfigured(true);
      setLoading(true);
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const nextProfile = await loadProfile(nextUser.uid);
      if (nextProfile && nextProfile.status !== "ACTIVE") {
        await signOutStaff();
        setProfile(null);
        setUser(null);
      } else {
        setProfile(nextProfile);
      }
      setLoading(false);
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      return;
    }
    setProfile(await getUserProfile(user.uid));
  }, [user]);

  const signIn = useCallback((email: string, password: string) => signInStaff(email, password), []);
  const signUp = useCallback(
    (input: { name: string; email: string; password: string }) => registerOwner(input),
    [],
  );
  const resetPassword = useCallback((email: string) => requestPasswordReset(email), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isConfigured,
      configured: isConfigured,
      refreshProfile,
      signIn,
      signUp,
      signOut: signOutStaff,
      resetPassword,
    }),
    [user, profile, loading, isConfigured, refreshProfile, signIn, signUp, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
