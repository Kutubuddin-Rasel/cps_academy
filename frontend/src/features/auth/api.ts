import { apiRequest } from "@/lib/api/request";
import { parseAuthToken, parseMeResponse } from "./parsers";
import type { CurrentUser } from "./types";

export async function loginRequest(identifier: string, password: string, signal: AbortSignal): Promise<string> {
  const payload = await apiRequest("/api/auth/local", {
    method: "POST", body: { identifier, password }, signal,
  });
  return parseAuthToken(payload);
}

export async function registerRequest(
  username: string, email: string, password: string, signal: AbortSignal,
): Promise<string> {
  const payload = await apiRequest("/api/auth/local/register", {
    method: "POST", body: { username, email, password }, signal,
  });
  return parseAuthToken(payload);
}

export async function getMe(token: string, signal: AbortSignal): Promise<CurrentUser> {
  return parseMeResponse(await apiRequest("/api/me", { token, signal }));
}
