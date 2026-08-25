import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import {
  getAuthenticatedLmsUser,
  isUnknownRecord,
  LMS_ROLES,
} from "../../../utils/auth";
import { getOwnedLessonCourseDocumentId } from "../utils/course";

const { ForbiddenError, NotFoundError, UnauthorizedError } = errors;
const LESSON_UID = "api::lesson.lesson";

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

export default async function isLessonCourseOwner(
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
    throw new ForbiddenError("You cannot manage Lessons.");
  }

  const documentId = getRouteDocumentId(policyContext);

  if (!documentId) {
    throw new NotFoundError("Lesson not found");
  }

  const lesson = await strapi.documents(LESSON_UID).findOne({
    documentId,
    populate: "course",
  });

  if (!lesson || !lesson.course) {
    throw new NotFoundError("Lesson not found");
  }

  await getOwnedLessonCourseDocumentId(
    strapi,
    lesson.course.documentId,
    user.id,
  );

  return true;
}
