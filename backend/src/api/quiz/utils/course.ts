import type { Core, Data } from "@strapi/strapi";
import { errors } from "@strapi/utils";

const { ForbiddenError, ValidationError } = errors;
const COURSE_UID = "api::course.course";

type QuizCourseAccess = {
  documentId: string;
  instructorId: Data.ID;
};

function isCourseDocumentId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function getQuizCourse(
  strapi: Core.Strapi,
  value: unknown,
): Promise<QuizCourseAccess> {
  if (!isCourseDocumentId(value)) {
    throw new ValidationError(
      "Quiz course must be a valid Course documentId.",
    );
  }

  const course = await strapi.documents(COURSE_UID).findOne({
    documentId: value,
    populate: "instructor",
  });

  if (!course || !course.instructor) {
    throw new ValidationError("Selected Course was not found.");
  }

  return {
    documentId: course.documentId,
    instructorId: course.instructor.id,
  };
}

export async function getValidQuizCourseDocumentId(
  strapi: Core.Strapi,
  value: unknown,
): Promise<string> {
  const course = await getQuizCourse(strapi, value);
  return course.documentId;
}

export async function getOwnedQuizCourseDocumentId(
  strapi: Core.Strapi,
  value: unknown,
  instructorId: Data.ID,
): Promise<string> {
  const course = await getQuizCourse(strapi, value);

  if (course.instructorId !== instructorId) {
    throw new ForbiddenError(
      "You can only manage Quizzes in your own Courses.",
    );
  }

  return course.documentId;
}
