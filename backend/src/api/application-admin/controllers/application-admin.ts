import type { Core, Data } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import type { Context } from "koa";
import {
  getAuthenticatedLmsUser,
  isUnknownRecord,
  LMS_ROLES,
} from "../../../utils/auth";

const { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } =
  errors;
const USER_UID = "plugin::users-permissions.user";
const ROLE_UID = "plugin::users-permissions.role";

type LmsRole = "Admin" | "Content Manager" | "Instructor" | "Student";
type ManagedUser = Data.ContentType<
  typeof USER_UID,
  "username" | "email" | "role"
>;

const LMS_ROLE_TYPES: Record<LmsRole, string> = {
  Admin: "admin",
  "Content Manager": "content-manager",
  Instructor: "instructor",
  Student: "student",
};

function requireAdmin(ctx: Context): void {
  const user = getAuthenticatedLmsUser(ctx.state.user);

  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }

  if (user.roleName !== LMS_ROLES.ADMIN) {
    throw new ForbiddenError("Only Admin can manage application users and stats.");
  }
}

function isLmsRole(value: unknown): value is LmsRole {
  return (
    value === LMS_ROLES.ADMIN ||
    value === LMS_ROLES.CONTENT_MANAGER ||
    value === LMS_ROLES.INSTRUCTOR ||
    value === LMS_ROLES.STUDENT
  );
}

function getRequestedRole(body: unknown): LmsRole | null {
  if (
    !isUnknownRecord(body) ||
    Object.keys(body).length !== 1 ||
    !Object.prototype.hasOwnProperty.call(body, "role")
  ) {
    throw new ValidationError('The request body must contain only "role".');
  }

  if (body.role === null) {
    return null;
  }

  if (!isLmsRole(body.role)) {
    throw new ValidationError(
      "Role must be Admin, Content Manager, Instructor, Student, or null.",
    );
  }

  return body.role;
}

function getUserId(value: unknown): number {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new ValidationError("User ID must be a positive integer.");
  }

  const id = Number(value);

  // Application users have PostgreSQL integer primary keys.
  if (!Number.isSafeInteger(id) || id > 2_147_483_647) {
    throw new ValidationError("User ID is outside the supported range.");
  }

  return id;
}

function userResponse(user: ManagedUser) {
  const roleName = user.role?.name;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: isLmsRole(roleName) ? roleName : null,
  };
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async users(ctx: Context) {
    requireAdmin(ctx);

    const users = await strapi.documents(USER_UID).findMany({
      fields: ["username", "email"],
      populate: { role: { fields: ["name"] } },
      sort: ["id:asc"],
    });

    ctx.body = { data: { users: users.map(userResponse) } };
  },

  async changeRole(ctx: Context) {
    requireAdmin(ctx);

    const requestedRole = getRequestedRole(ctx.request.body);
    const userId = getUserId(ctx.params.userId);
    const user = await strapi.documents(USER_UID).findFirst({
      filters: { id: userId },
      fields: ["username", "email"],
      populate: { role: { fields: ["name", "type"] } },
    });

    if (!user) {
      throw new NotFoundError("Application user not found.");
    }

    const currentRoleType = user.role?.type;
    const targetRoleType = requestedRole === null
      ? "authenticated"
      : LMS_ROLE_TYPES[requestedRole];

    if (currentRoleType === targetRoleType) {
      ctx.body = { data: { user: userResponse(user) } };
      return;
    }

    if (currentRoleType === LMS_ROLE_TYPES.Instructor) {
      const course = await strapi.documents("api::course.course").findFirst({
        filters: { instructor: { id: user.id } },
        fields: ["documentId"],
      });

      if (course) {
        return ctx.conflict(
          "Reassign the Instructor's Courses before changing their role.",
        );
      }
    }

    if (
      currentRoleType === LMS_ROLE_TYPES.Admin &&
      targetRoleType !== LMS_ROLE_TYPES.Admin
    ) {
      const adminCount = await strapi.documents(USER_UID).count({
        filters: { role: { type: LMS_ROLE_TYPES.Admin } },
      });

      if (adminCount <= 1) {
        return ctx.conflict("Cannot remove the last Admin application user.");
      }
    }

    const role = await strapi.documents(ROLE_UID).findFirst({
      filters: { type: targetRoleType },
      fields: ["name", "type"],
    });

    if (
      !role ||
      role.type !== targetRoleType ||
      (requestedRole !== null && role.name !== requestedRole)
    ) {
      throw new ValidationError("The requested LMS role is not configured.");
    }

    const updatedUser = await strapi.documents(USER_UID).update({
      documentId: user.documentId,
      data: { role: role.id },
      fields: ["username", "email"],
      populate: { role: { fields: ["name", "type"] } },
    });

    if (!updatedUser) {
      throw new NotFoundError("Application user not found.");
    }

    ctx.body = { data: { user: userResponse(updatedUser) } };
  },

  async stats(ctx: Context) {
    requireAdmin(ctx);

    const [users, courses, enrollments] = await Promise.all([
      strapi.documents(USER_UID).findMany({
        fields: ["id"],
        populate: { role: { fields: ["name"] } },
      }),
      strapi.documents("api::course.course").count({}),
      strapi.documents("api::enrollment.enrollment").count({}),
    ]);
    const byRole = { Admin: 0, "Content Manager": 0, Instructor: 0, Student: 0, Unassigned: 0 };

    for (const user of users) {
      const roleName = user.role?.name;
      if (isLmsRole(roleName)) {
        byRole[roleName] += 1;
      } else {
        byRole.Unassigned += 1;
      }
    }

    ctx.body = {
      data: {
        users: { total: users.length, byRole },
        courses: { total: courses },
        enrollments: { total: enrollments },
      },
    };
  },
});
