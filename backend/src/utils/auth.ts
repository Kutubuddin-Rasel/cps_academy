import type { Data } from "@strapi/strapi";

export const LMS_ROLES = {
  ADMIN: "Admin",
  CONTENT_MANAGER: "Content Manager",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
};

export type AuthenticatedLmsUser = {
  id: Data.ID;
  roleName: string;
};

export function isUnknownRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getAuthenticatedLmsUser(
  value: unknown,
): AuthenticatedLmsUser | undefined {
  if (!isUnknownRecord(value) || !isUnknownRecord(value.role)) {
    return undefined;
  }

  const { id } = value;
  const { name: roleName } = value.role;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof roleName !== "string"
  ) {
    return undefined;
  }

  return { id, roleName };
}
