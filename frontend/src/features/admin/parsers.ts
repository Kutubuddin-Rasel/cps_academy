import type { LmsRole } from "@/features/auth/types";
import { ApiError } from "@/lib/api/error";
import { isRecord } from "@/lib/api/response-guards";
import type { AdminStats, AdminUser } from "./types";

export function isManagedRole(value: unknown): value is LmsRole | null {
  return value === null || value === "Admin" || value === "Content Manager" || value === "Instructor" || value === "Student";
}

function parseUser(value: unknown): AdminUser {
  if (!isRecord(value)
    || typeof value.id !== "number" || !Number.isSafeInteger(value.id) || value.id < 1
    || typeof value.username !== "string" || !value.username.trim()
    || typeof value.email !== "string" || !value.email.trim()
    || !isManagedRole(value.role)) {
    throw new ApiError(502, "CPS Academy returned invalid user data. Please try again.");
  }
  return { id: value.id, username: value.username, email: value.email, role: value.role };
}

export function parseAdminUsers(payload: unknown): AdminUser[] {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.users)) {
    throw new ApiError(502, "CPS Academy returned an invalid user list. Please try again.");
  }
  return payload.data.users.map((value: unknown) => parseUser(value));
}

export function parseRoleChange(payload: unknown): AdminUser {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new ApiError(502, "CPS Academy returned an invalid role update. Refresh to check the current role.");
  }
  return parseUser(payload.data.user);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function parseAdminStats(payload: unknown): AdminStats {
  const message = "CPS Academy returned invalid platform stats. Please try again.";
  if (!isRecord(payload) || !isRecord(payload.data)) throw new ApiError(502, message);
  const { users, courses, enrollments } = payload.data;
  if (!isRecord(users) || !isRecord(users.byRole) || !isRecord(courses) || !isRecord(enrollments)
    || !isCount(users.total) || !isCount(courses.total) || !isCount(enrollments.total)
    || !isCount(users.byRole.Admin) || !isCount(users.byRole["Content Manager"])
    || !isCount(users.byRole.Instructor) || !isCount(users.byRole.Student) || !isCount(users.byRole.Unassigned)) {
    throw new ApiError(502, message);
  }
  return {
    users: {
      total: users.total,
      byRole: {
        Admin: users.byRole.Admin,
        "Content Manager": users.byRole["Content Manager"],
        Instructor: users.byRole.Instructor,
        Student: users.byRole.Student,
        Unassigned: users.byRole.Unassigned,
      },
    },
    courses: { total: courses.total },
    enrollments: { total: enrollments.total },
  };
}
