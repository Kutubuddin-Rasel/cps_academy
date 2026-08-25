import type { Core, Data } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import { getAuthenticatedLmsUser, LMS_ROLES } from "../../../utils/auth";

const { ValidationError } = errors;
const USER_UID = "plugin::users-permissions.user";

function isValidUserId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export async function getValidInstructorId(
  strapi: Core.Strapi,
  value: unknown,
): Promise<Data.ID> {
  if (!isValidUserId(value)) {
    throw new ValidationError("Course instructor must be a valid user ID");
  }

  const user = await strapi.db
    .query(USER_UID)
    .findOne({ where: { id: value }, populate: ["role"] });

  const resolvedUser = getAuthenticatedLmsUser(user);

  if (!resolvedUser) {
    throw new ValidationError("Selected instructor user was not found.");
  }

  if (resolvedUser.roleName !== LMS_ROLES.INSTRUCTOR) {
    throw new ValidationError(
      "Course instructor must have the Instructor role.",
    );
  }

  return resolvedUser.id;
}
