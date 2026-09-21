import type { AuthTokens } from "./types";

const ACCESS_KEY = "dtc_access_token";
const REFRESH_KEY = "dtc_refresh_token";

export const tokenStorage = {
  get(): AuthTokens | null {
    if (typeof window === "undefined") return null;
    const accessToken = localStorage.getItem(ACCESS_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  },
  save(tokens: AuthTokens) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
