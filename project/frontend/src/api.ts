import type {
  HomeResponse,
  SettingsResponse,
  StockDetailResponse,
  TimelineResponse,
  WatchManageResponse,
  SecuritySearchHit,
} from "./types";

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export class ApiRequestError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, payload: unknown) {
    super(typeof payload === "object" && payload && "error" in payload ? String((payload as { error: string }).error) : `Request failed (${status})`);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers, credentials: "include" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiRequestError(response.status, payload);
  return payload as T;
}

export const api = {
  home: () => request<HomeResponse>("/api/home"),
  search: (q: string) => request<{ results: SecuritySearchHit[] }>(`/api/search?q=${encodeURIComponent(q)}`),
  watchlistManage: () => request<WatchManageResponse>("/api/watchlist/manage"),
  addWatch: (body: { symbol: string; watchType?: string; expiresAt?: string | null }) =>
    request<{ ok: true }>("/api/watchlist", { method: "POST", body: JSON.stringify(body) }),
  updateWatch: (body: { symbol: string; threshold?: number | null; mute?: boolean; watchType?: string; expiresAt?: string | null }) =>
    request<{ ok: true }>("/api/watchlist/manage", { method: "POST", body: JSON.stringify(body) }),
  removeWatch: (symbol: string) => request<{ ok: true }>(`/api/watchlist/${encodeURIComponent(symbol)}`, { method: "DELETE" }),
  stock: (symbol: string) => request<StockDetailResponse>(`/api/stocks/${encodeURIComponent(symbol)}`),
  timeline: (symbol: string, layer?: string) => {
    const query = layer && layer !== "All" ? `?layer=${encodeURIComponent(layer)}` : "";
    return request<TimelineResponse>(`/api/stocks/${encodeURIComponent(symbol)}/timeline${query}`);
  },
  settings: () => request<SettingsResponse>("/api/settings"),
  saveSettings: (body: Partial<Pick<SettingsResponse, "price" | "volume" | "news" | "earnings" | "corporate_actions">>) =>
    request<{ ok: true }>("/api/settings", { method: "POST", body: JSON.stringify(body) }),
  muteCategory: (category: string, muted: boolean) =>
    request<{ ok: true }>("/api/settings/muted-categories", { method: "POST", body: JSON.stringify({ category, muted }) }),
  acknowledge: (symbol: string) =>
    request<{ ok: true }>("/api/acknowledgments", { method: "POST", body: JSON.stringify({ symbol }) }),
  refresh: () => request<{ ok: true }>("/api/refresh", { method: "POST", body: JSON.stringify({}) }),
  signup: (email: string, password: string) =>
    request<{ ok: true }>("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<{ ok: true }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST", body: JSON.stringify({}) }),
};
