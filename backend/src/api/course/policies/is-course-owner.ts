import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import {
  getAuthenticatedLmsUser,
  isUnknownRecord,
  LMS_ROLES,
} from "../../../utils/auth";

const { ForbiddenError, NotFoundError, UnauthorizedError } = errors;

function getRouteDocumentId(policyContext: unknown): string | undefined {
  if (
    !isUnknownRecord(policyContext) ||
    !isUnknownRecord(policyContext.params)
  ) {
    return undefined;
  }

  const { id } = policyContext.params;
  return typeof id === "string" ? id : undefined;
}

function getPolicyUser(policyContext: unknown): unknown {
  if (
    !isUnknownRecord(policyContext) ||
    !isUnknownRecord(policyContext.state)
  ) {
    return undefined;
  }

  return policyContext.state.user;
}

export default async function isCourseOwner(
  policyContext: unknown,
  _config: unknown,
  { strapi }: { strapi: Core.Strapi },
): Promise<boolean> {
  const user = getAuthenticatedLmsUser(getPolicyUser(policyContext));

  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }

  if (
    user.roleName === LMS_ROLES.ADMIN ||
    user.roleName === LMS_ROLES.CONTENT_MANAGER
  ) {
    return true;
  }

  if (user.roleName !== LMS_ROLES.INSTRUCTOR) {
    throw new ForbiddenError("You cannot manage courses");
  }

  const documentId = getRouteDocumentId(policyContext);

  if (!documentId) {
    throw new NotFoundError("Course not found");
  }

  const course = await strapi.documents("api::course.course").findOne({
    documentId,
    populate: "instructor",
  });

  if (!course) {
    throw new NotFoundError("Course not found");
  }

  if (!course.instructor || course.instructor.id !== user.id) {
    throw new ForbiddenError("You can only manage your own courses");
  }

  return true;
}
