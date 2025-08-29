import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Api } from "@/lib/api";

type User = { email: string } | null;

type AuthContextType = {
  user: User;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [tok, setTok] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("auth_token");
    const e = localStorage.getItem("auth_email");
    if (t && e) { setTok(t); setUser({ email: e }); }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token: tok,
    login: async (email, password) => {
      const res = await Api.login(email, password);
      localStorage.setItem("auth_token", res.token);
      localStorage.setItem("auth_email", email);
      setTok(res.token);
      setUser({ email });
    },
    logout: async () => {
      await Api.logout();
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_email");
      setTok(null);
      setUser(null);
    },
  }), [user, tok]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
