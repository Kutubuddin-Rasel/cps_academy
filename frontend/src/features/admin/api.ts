import { apiRequest } from "@/lib/api/request";
import { parseAdminStats, parseAdminUsers, parseRoleChange } from "./parsers";
import type { AdminStats, AdminUser, RoleChangeInput } from "./types";

export async function getAdminStats(token: string, signal: AbortSignal): Promise<AdminStats> {
  return parseAdminStats(await apiRequest("/api/admin/stats", { token, signal }));
}

export async function getAdminUsers(token: string, signal: AbortSignal): Promise<AdminUser[]> {
  return parseAdminUsers(await apiRequest("/api/admin/users", { token, signal }));
}

export async function changeUserRole(userId: number, input: RoleChangeInput, token: string, signal: AbortSignal): Promise<AdminUser> {
  return parseRoleChange(await apiRequest(`/api/admin/users/${encodeURIComponent(String(userId))}/role`, {
    method: "PATCH", body: { role: input.role }, token, signal,
  }));
}
