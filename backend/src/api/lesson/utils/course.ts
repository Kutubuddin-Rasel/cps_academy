import type { Core, Data } from "@strapi/strapi";
import { errors } from "@strapi/utils";

const { ForbiddenError, ValidationError } = errors;
const COURSE_UID = "api::course.course";

type LessonCourseAccess = {
  documentId: string;
  instructorId: Data.ID;
};

function isCourseDocumentId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

async function getLessonCourse(
  strapi: Core.Strapi,
  value: unknown,
): Promise<LessonCourseAccess> {
  if (!isCourseDocumentId(value)) {
    throw new ValidationError(
      "Lesson course must be a valid Course documentId.",
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

export async function getValidLessonCourseDocumentId(
  strapi: Core.Strapi,
  value: unknown,
): Promise<string> {
  const course = await getLessonCourse(strapi, value);
  return course.documentId;
}

export async function getOwnedLessonCourseDocumentId(
  strapi: Core.Strapi,
  value: unknown,
  instructorId: Data.ID,
): Promise<string> {
  const course = await getLessonCourse(strapi, value);

  if (course.instructorId !== instructorId) {
    throw new ForbiddenError(
      "You can only manage Lessons in your own Courses.",
    );
  }

  return course.documentId;
}
