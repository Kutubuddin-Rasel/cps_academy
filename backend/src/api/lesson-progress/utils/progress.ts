import type { Core, Data } from "@strapi/strapi";
import { errors } from "@strapi/utils";

const { ForbiddenError, NotFoundError, ValidationError } = errors;
const LESSON_UID = "api::lesson.lesson";
const ENROLLMENT_UID = "api::enrollment.enrollment";
const PROGRESS_UID = "api::lesson-progress.lesson-progress";

type CourseLesson = {
  documentId: string;
  order: number;
};

export async function getCompletionLesson(
  strapi: Core.Strapi,
  documentId: string,
) {
  const lesson = await strapi.documents(LESSON_UID).findOne({
    documentId,
    fields: ["documentId", "order"],
    populate: { course: { fields: ["documentId"] } },
  });

  if (!lesson || !lesson.course?.documentId) {
    throw new NotFoundError("Lesson not found.");
  }

  if (
    typeof lesson.order !== "number" ||
    !Number.isInteger(lesson.order) ||
    lesson.order < 1
  ) {
    throw new ValidationError("Lesson order is invalid.");
  }

  return {
    documentId: lesson.documentId,
    order: lesson.order,
    courseDocumentId: lesson.course.documentId,
  };
}

export async function requireCourseEnrollment(
  strapi: Core.Strapi,
  studentId: Data.ID,
  courseDocumentId: string,
): Promise<void> {
  const enrollment = await strapi.documents(ENROLLMENT_UID).findFirst({
    filters: {
      student: { id: studentId },
      course: { documentId: courseDocumentId },
    },
    fields: ["documentId"],
  });

  if (!enrollment) {
    throw new ForbiddenError("You must be enrolled in this Course.");
  }
}

export async function getCourseCompletionState(
  strapi: Core.Strapi,
  studentId: Data.ID,
  courseDocumentId: string,
) {
  const entries = await strapi.documents(LESSON_UID).findMany({
    filters: { course: { documentId: courseDocumentId } },
    fields: ["documentId", "order"],
  });
  const lessons: CourseLesson[] = [];

  for (const lesson of entries) {
    if (
      typeof lesson.documentId !== "string" ||
      typeof lesson.order !== "number" ||
      !Number.isInteger(lesson.order) ||
      lesson.order < 1
    ) {
      throw new ValidationError("Course Lesson sequence is invalid.");
    }

    lessons.push({ documentId: lesson.documentId, order: lesson.order });
  }

  const currentLessonIds = new Set(lessons.map((lesson) => lesson.documentId));
  const completedLessonIds = new Set<string>();

  if (currentLessonIds.size > 0) {
    const completions = await strapi.documents(PROGRESS_UID).findMany({
      filters: {
        student: { id: studentId },
        lesson: { documentId: { $in: [...currentLessonIds] } },
      },
      fields: ["documentId"],
      populate: {
        lesson: { fields: ["documentId"] },
        course: { fields: ["documentId"] },
      },
    });

    for (const completion of completions) {
      const lessonDocumentId = completion.lesson?.documentId;

      // A Course link alone is not proof of a valid completion.
      if (
        typeof lessonDocumentId === "string" &&
        currentLessonIds.has(lessonDocumentId) &&
        completion.course?.documentId === courseDocumentId
      ) {
        completedLessonIds.add(lessonDocumentId);
      }
    }
  }

  return { lessons, completedLessonIds, totalLessons: currentLessonIds.size };
}

export function calculateProgress(totalLessons: number, completedLessons: number) {
  return {
    completedLessons,
    totalLessons,
    percentage:
      totalLessons === 0
        ? 0
        : Math.round((completedLessons / totalLessons) * 100),
  };
}
