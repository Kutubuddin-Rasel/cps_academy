import type { Context } from "koa";
import { LMS_ROLES, isUnknownRecord, getAuthenticatedLmsUser } from "../../../utils/auth";

export default {
  async me(ctx: Context) {
    const stateUser = ctx.state.user;

    if (!isUnknownRecord(stateUser) || typeof stateUser.id !== "number" && typeof stateUser.id !== "string") {
      return ctx.unauthorized();
    }

    const userId = stateUser.id;

    const dbUser: unknown = await strapi
      .documents("plugin::users-permissions.user")
      .findFirst({
        filters: { id: userId },
        fields: ["id", "username", "email"],
        populate: {
          role: {
            fields: ["name", "type"],
          },
        },
      });

    if (!isUnknownRecord(dbUser)) {
      return ctx.unauthorized();
    }

    let roleName: string | null = null;
    const dbRole = dbUser.role;

    if (isUnknownRecord(dbRole) && typeof dbRole.name === "string") {
      const name = dbRole.name;
      if (
        name === LMS_ROLES.ADMIN ||
        name === LMS_ROLES.CONTENT_MANAGER ||
        name === LMS_ROLES.INSTRUCTOR ||
        name === LMS_ROLES.STUDENT
      ) {
        roleName = name;
      }
    }

    ctx.body = {
      data: {
        user: {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          role: roleName,
        },
      },
    };
  },

  async instructors(ctx: Context) {
    const user = getAuthenticatedLmsUser(ctx.state.user);

    if (!user) {
      return ctx.unauthorized();
    }

    if (user.roleName !== LMS_ROLES.ADMIN && user.roleName !== LMS_ROLES.CONTENT_MANAGER) {
      return ctx.forbidden("Access denied.");
    }

    const instructorsData: unknown = await strapi
      .documents("plugin::users-permissions.user")
      .findMany({
        filters: {
          role: {
            type: "instructor",
          },
        },
        fields: ["id", "username"],
        sort: { username: "asc" },
      });

    if (!Array.isArray(instructorsData)) {
      throw new Error("Failed to load instructors.");
    }

    const safeInstructors = instructorsData.map((inst: unknown) => {
      if (!isUnknownRecord(inst) || typeof inst.id !== "number" || typeof inst.username !== "string") {
        throw new Error("Invalid user record.");
      }
      return { id: inst.id, username: inst.username };
    });

    ctx.body = {
      data: {
        instructors: safeInstructors,
      },
    };
  },
};
