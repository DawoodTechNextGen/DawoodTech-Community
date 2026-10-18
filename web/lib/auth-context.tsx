"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type LoginInput, type SignupInput } from "./api-client";
import { syncAppBadge } from "./app-badge";
import { tokenStorage } from "./token-storage";
import type { PublicUser } from "./types";

interface AuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: SignupInput) => Promise<PublicUser>;
  logout: () => Promise<void>;
  updateUser: (user: PublicUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!tokenStorage.get()) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await api.me();
        if (!cancelled) setUser(me);
      } catch {
        tokenStorage.clear();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const res = await api.login(input);
    tokenStorage.save(res);
    setUser(res.user);
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const res = await api.signup(input);
    // No tokens on signup — the account isn't usable until the email is
    // verified, so we deliberately don't log the user in here.
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    syncAppBadge(0);
  }, []);

  const updateUser = useCallback((updated: PublicUser) => {
    setUser((prev) => (prev && prev.id === updated.id ? updated : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, signup, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
