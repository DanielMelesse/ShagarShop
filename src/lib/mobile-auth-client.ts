"use client";

const ACCESS_KEY = "sheger_access_token";
const REFRESH_KEY = "sheger_refresh_token";

export interface StoredMobileTokens {
  accessToken: string;
  refreshToken: string;
}

let accessCache: string | null = null;
let refreshCache: string | null = null;
let tokensHydrated = false;

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor?.isNativePlatform?.(),
  );
}

async function persistTokens(tokens: StoredMobileTokens | null) {
  if (isNativeApp()) {
    const { Preferences } = await import("@capacitor/preferences");
    if (tokens) {
      await Preferences.set({ key: ACCESS_KEY, value: tokens.accessToken });
      await Preferences.set({ key: REFRESH_KEY, value: tokens.refreshToken });
    } else {
      await Preferences.remove({ key: ACCESS_KEY });
      await Preferences.remove({ key: REFRESH_KEY });
    }
    return;
  }

  if (tokens) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  } else {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

/** Load tokens from secure storage on native app startup. */
export async function hydrateMobileTokens(): Promise<void> {
  if (typeof window === "undefined" || tokensHydrated) return;

  if (isNativeApp()) {
    const { Preferences } = await import("@capacitor/preferences");
    accessCache = (await Preferences.get({ key: ACCESS_KEY })).value;
    refreshCache = (await Preferences.get({ key: REFRESH_KEY })).value;
  } else {
    accessCache = localStorage.getItem(ACCESS_KEY);
    refreshCache = localStorage.getItem(REFRESH_KEY);
  }

  tokensHydrated = true;
}

export function getMobileAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  if (isNativeApp()) return accessCache;
  return localStorage.getItem(ACCESS_KEY);
}

export function getMobileRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  if (isNativeApp()) return refreshCache;
  return localStorage.getItem(REFRESH_KEY);
}

export function storeMobileTokens(tokens: StoredMobileTokens) {
  accessCache = tokens.accessToken;
  refreshCache = tokens.refreshToken;
  tokensHydrated = true;
  void persistTokens(tokens);
}

export function clearMobileTokens() {
  accessCache = null;
  refreshCache = null;
  void persistTokens(null);
}

export async function mobileLogin(phone: string, password: string) {
  const res = await fetch("/api/auth/mobile/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false as const,
      error: typeof data.error === "string" ? data.error : "Login failed.",
    };
  }
  storeMobileTokens({
    accessToken: data.accessToken as string,
    refreshToken: data.refreshToken as string,
  });
  return { ok: true as const, user: data.user };
}

export async function refreshMobileAccessToken(): Promise<string | null> {
  const refreshToken = getMobileRefreshToken();
  if (!refreshToken) return null;
  const res = await fetch("/api/auth/mobile/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    clearMobileTokens();
    return null;
  }
  storeMobileTokens({
    accessToken: data.accessToken as string,
    refreshToken: data.refreshToken as string,
  });
  return data.accessToken as string;
}

export function mobileAuthHeaders(): Record<string, string> {
  const token = getMobileAccessToken();
  const headers: Record<string, string> = {
    "x-sheger-client": isNativeApp() ? "capacitor" : "mobile",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function mobileFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  await hydrateMobileTokens();

  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(mobileAuthHeaders())) {
    headers.set(key, value);
  }

  let res = await fetch(input, { ...init, headers, credentials: "same-origin" });

  if (res.status === 401 && getMobileRefreshToken()) {
    const next = await refreshMobileAccessToken();
    if (next) {
      headers.set("Authorization", `Bearer ${next}`);
      res = await fetch(input, { ...init, headers, credentials: "same-origin" });
    }
  }

  return res;
}
