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

function getRequestedRole(body: unknown): LmsRole {
  if (
    !isUnknownRecord(body) ||
    Object.keys(body).length !== 1 ||
    !Object.prototype.hasOwnProperty.call(body, "role")
  ) {
    throw new ValidationError('The request body must contain only "role".');
  }

  if (body.role === null) {
    throw new ValidationError(
      "Removing a Users & Permissions role is not supported. Assign another LMS role instead.",
    );
  }

  if (!isLmsRole(body.role)) {
    throw new ValidationError(
      "Role must be Admin, Content Manager, Instructor, or Student.",
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
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role?.name ?? null,
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

    const roleName = getRequestedRole(ctx.request.body);
    const userId = getUserId(ctx.params.userId);
    const user = await strapi.documents(USER_UID).findFirst({
      filters: { id: userId },
      fields: ["username", "email"],
      populate: { role: { fields: ["name"] } },
    });

    if (!user) {
      throw new NotFoundError("Application user not found.");
    }

    if (user.role?.name === roleName) {
      ctx.body = { data: { user: userResponse(user) } };
      return;
    }

    if (user.role?.name === LMS_ROLES.INSTRUCTOR) {
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

    const role = await strapi.documents(ROLE_UID).findFirst({
      filters: { name: roleName },
      fields: ["name"],
    });

    if (!role) {
      throw new ValidationError("The requested LMS role is not configured.");
    }

    const updatedUser = await strapi.documents(USER_UID).update({
      documentId: user.documentId,
      data: { role: role.id },
      fields: ["username", "email"],
      populate: { role: { fields: ["name"] } },
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
    const byRole = { Admin: 0, "Content Manager": 0, Instructor: 0, Student: 0 };

    for (const user of users) {
      const roleName = user.role?.name;
      if (isLmsRole(roleName)) {
        byRole[roleName] += 1;
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
