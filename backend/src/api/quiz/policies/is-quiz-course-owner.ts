import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import {
  getAuthenticatedLmsUser,
  isUnknownRecord,
  LMS_ROLES,
} from "../../../utils/auth";
import { getOwnedQuizCourseDocumentId } from "../utils/course";

const { ForbiddenError, NotFoundError, UnauthorizedError } = errors;
const QUIZ_UID = "api::quiz.quiz";

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

export default async function isQuizCourseOwner(
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
    throw new ForbiddenError("You cannot manage Quizzes.");
  }

  const documentId = getRouteDocumentId(policyContext);

  if (!documentId) {
    throw new NotFoundError("Quiz not found");
  }

  const quiz = await strapi.documents(QUIZ_UID).findOne({
    documentId,
    populate: "course",
  });

  if (!quiz || !quiz.course) {
    throw new NotFoundError("Quiz not found");
  }

  await getOwnedQuizCourseDocumentId(
    strapi,
    quiz.course.documentId,
    user.id,
  );

  return true;
}
