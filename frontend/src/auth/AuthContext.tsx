import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../api/auth";
import { TOKEN_KEY } from "../api/http";
import type { TokenPair, User } from "../types";

type Status = "loading" | "authenticated" | "guest";

interface AuthState {
  status: Status;
  user: User | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }) => Promise<User>;
  setUser: (u: User) => void;
  logout: () => void;
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    status: "loading",
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
  }));

  const applyTokenPair = useCallback((pair: TokenPair) => {
    localStorage.setItem(TOKEN_KEY, pair.access_token);
    setState({ status: "authenticated", user: pair.user, token: pair.access_token });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ status: "guest", user: null, token: null });
  }, []);

  const refresh = useCallback(async (): Promise<User | null> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState({ status: "guest", user: null, token: null });
      return null;
    }
    try {
      const user = await authApi.me();
      setState({ status: "authenticated", user, token });
      return user;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setState({ status: "guest", user: null, token: null });
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
    const onUnauthorized = () => logout();
    window.addEventListener("macroplus:unauthorized", onUnauthorized);
    return () => window.removeEventListener("macroplus:unauthorized", onUnauthorized);
  }, [refresh, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login: async (email, password) => {
        const pair = await authApi.login({ email, password });
        applyTokenPair(pair);
        return pair.user;
      },
      register: async (data) => {
        const pair = await authApi.register(data);
        applyTokenPair(pair);
        return pair.user;
      },
      setUser: (u) => setState((s) => ({ ...s, user: u, status: "authenticated" })),
      logout,
      refresh,
    }),
    [state, applyTokenPair, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
