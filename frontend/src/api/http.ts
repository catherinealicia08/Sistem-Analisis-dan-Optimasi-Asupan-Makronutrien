import axios, { AxiosError } from "axios";

export const TOKEN_KEY = "macroplus.token";

const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

export const http = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Soft signal — AuthContext also reacts via its bootstrap.
      window.dispatchEvent(new CustomEvent("macroplus:unauthorized"));
    }
    return Promise.reject(err);
  },
);

export const apiErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const detail = (err.response?.data as { detail?: string | { msg?: string }[] } | undefined)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg ?? "").filter(Boolean).join(", ");
    return err.message;
  }
  return err instanceof Error ? err.message : String(err);
};
