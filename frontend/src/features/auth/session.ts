import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { getMe } from "./api";
import { getToken, STORAGE_ERROR_MESSAGE } from "./storage";
import type { ResolvedAuthState } from "./types";

export async function verifySession(token: string, signal: AbortSignal): Promise<ResolvedAuthState> {
  try {
    const user = await getMe(token, signal);
    return { status: "authenticated", user, token };
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 401) return { status: "unauthenticated" };
    return { status: "error", message: requestErrorMessage(error) };
  }
}

export async function restoreStoredSession(signal: AbortSignal): Promise<ResolvedAuthState> {
  let token: string | null;
  try {
    token = getToken();
  } catch {
    return { status: "error", message: STORAGE_ERROR_MESSAGE };
  }
  return token ? verifySession(token, signal) : { status: "unauthenticated" };
}
