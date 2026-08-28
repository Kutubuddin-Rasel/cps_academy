const TOKEN_KEY = "cps_academy:token";

export const STORAGE_ERROR_MESSAGE = "Browser session storage is unavailable. Allow site storage, then try again.";

export function getToken(): string | null {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.sessionStorage.removeItem(TOKEN_KEY);
}
