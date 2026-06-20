import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "../types";
import { authAPI } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (formData: FormData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("chatsync_token");
    const storedUser = localStorage.getItem("chatsync_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem("chatsync_token", t);
    localStorage.setItem("chatsync_user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const res = await authAPI.register({ username, email, password });
      const { token: t, user: u } = res.data;
      localStorage.setItem("chatsync_token", t);
      localStorage.setItem("chatsync_user", JSON.stringify(u));
      setToken(t);
      setUser(u);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem("chatsync_token");
    localStorage.removeItem("chatsync_user");
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (formData: FormData) => {
    const res = await authAPI.updateProfile(formData);
    const { user: u, token: t } = res.data;
    localStorage.setItem("chatsync_user", JSON.stringify(u));
    setUser(u);
    if (t) {
      localStorage.setItem("chatsync_token", t);
      setToken(t);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
