import { ApiError } from "@/lib/api/error";
import { isRecord } from "@/lib/api/response-guards";
import type { CurrentUser, LmsRole } from "./types";

function isLmsRole(value: unknown): value is LmsRole {
  return value === "Admin" || value === "Content Manager" || value === "Instructor" || value === "Student";
}

export function parseMeResponse(payload: unknown): CurrentUser {
  const message = "CPS Academy returned an unexpected account response. Please try again.";
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.user)) {
    throw new ApiError(502, message);
  }
  const user = payload.data.user;
  if (
    typeof user.id !== "number" || !Number.isSafeInteger(user.id) || user.id <= 0
    || typeof user.username !== "string" || !user.username.trim()
    || typeof user.email !== "string" || !user.email.trim()
    || (user.role !== null && !isLmsRole(user.role))
  ) {
    throw new ApiError(502, message);
  }
  return { id: user.id, username: user.username, email: user.email, role: user.role };
}

export function parseAuthToken(payload: unknown): string {
  if (!isRecord(payload) || typeof payload.jwt !== "string" || !payload.jwt.trim()) {
    throw new ApiError(502, "CPS Academy did not return a valid session. Please try logging in.");
  }
  // The native auth user payload is intentionally ignored; /api/me owns identity.
  return payload.jwt.trim();
}
