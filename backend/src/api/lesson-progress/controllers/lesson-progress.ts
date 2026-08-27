import type { Data } from "@strapi/strapi";
import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import type { Knex } from "knex";
import {
  getAuthenticatedLmsUser,
  isUnknownRecord,
  LMS_ROLES,
} from "../../../utils/auth";
import {
  calculateProgress,
  getCompletionLesson,
  getCourseCompletionState,
  requireCourseEnrollment,
} from "../utils/progress";

const { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } =
  errors;
const PROGRESS_UID = "api::lesson-progress.lesson-progress";
const LESSON_UID = "api::lesson.lesson";
const COURSE_UID = "api::course.course";

function getStudentUser(value: unknown) {
  const user = getAuthenticatedLmsUser(value);

  if (!user) {
    throw new UnauthorizedError("Authentication required.");
  }

  if (user.roleName !== LMS_ROLES.STUDENT) {
    throw new ForbiddenError("Only Students may access their lesson progress.");
  }

  return user;
}

function getLessonDocumentId(params: unknown): string {
  if (
    !isUnknownRecord(params) ||
    typeof params.lessonDocumentId !== "string" ||
    params.lessonDocumentId.trim().length === 0
  ) {
    throw new NotFoundError("Lesson not found.");
  }

  return params.lessonDocumentId;
}

function getCourseDocumentId(params: unknown): string {
  if (
    !isUnknownRecord(params) ||
    typeof params.courseDocumentId !== "string" ||
    params.courseDocumentId.trim().length === 0
  ) {
    throw new NotFoundError("Course not found.");
  }

  return params.courseDocumentId;
}

function rejectClientCompletionData(body: unknown): void {
  if (!isUnknownRecord(body)) {
    return;
  }

  const data = isUnknownRecord(body.data) ? body.data : undefined;
  const controlledFields = [
    "student",
    "lesson",
    "course",
    "completed",
    "percentage",
    "score",
    "progress",
  ];

  if (
    controlledFields.some(
      (field) =>
        Object.prototype.hasOwnProperty.call(body, field) ||
        (data !== undefined && Object.prototype.hasOwnProperty.call(data, field)),
    )
  ) {
    throw new ValidationError(
      "Lesson completion data is controlled by the server.",
    );
  }
}

async function lockStudentForUpdate(
  transaction: Knex.Transaction,
  studentId: Data.ID,
): Promise<void> {
  const student: unknown = await transaction("up_users")
    .select("id")
    .where({ id: studentId })
    .forUpdate()
    .first();

  if (!isUnknownRecord(student)) {
    throw new UnauthorizedError("Authentication required.");
  }
}

async function lockStudentForShare(
  transaction: Knex.Transaction,
  studentId: Data.ID,
): Promise<void> {
  const student: unknown = await transaction("up_users")
    .select("id")
    .where({ id: studentId })
    .forShare()
    .first();

  if (!isUnknownRecord(student)) {
    throw new UnauthorizedError("Authentication required.");
  }
}

async function lockCourseForShare(
  transaction: Knex.Transaction,
  documentId: string,
): Promise<void> {
  const course: unknown = await transaction("courses")
    .select("id")
    .where({ document_id: documentId })
    .forShare()
    .first();

  if (!isUnknownRecord(course)) {
    throw new NotFoundError("Course not found.");
  }
}

async function lockLessonForKeyShare(
  transaction: Knex.Transaction,
  documentId: string,
): Promise<void> {
  const lesson: unknown = await transaction("lessons")
    .select("id")
    .where({ document_id: documentId })
    .forKeyShare()
    .first();

  if (!isUnknownRecord(lesson)) {
    throw new NotFoundError("Lesson not found.");
  }
}

function getLearningLessonData(value: unknown) {
  if (
    !isUnknownRecord(value) ||
    typeof value.documentId !== "string" ||
    typeof value.title !== "string" ||
    typeof value.order !== "number"
  ) {
    throw new NotFoundError("Lesson not found.");
  }

  return {
    documentId: value.documentId,
    title: value.title,
    content: typeof value.content === "string" ? value.content : null,
    videoUrl: typeof value.videoUrl === "string" ? value.videoUrl : null,
    order: value.order,
  };
}

export default factories.createCoreController(PROGRESS_UID, ({ strapi }) => ({
  async complete(ctx) {
    const user = getStudentUser(ctx.state.user);
    rejectClientCompletionData(ctx.request.body);
    const documentId = getLessonDocumentId(ctx.params);

    const result = await strapi.db.transaction(
      async ({ trx }: { trx: Knex.Transaction }) => {
        await lockStudentForUpdate(trx, user.id);
        const initialLesson = await getCompletionLesson(strapi, documentId);
        await lockCourseForShare(trx, initialLesson.courseDocumentId);

        const lesson = await getCompletionLesson(strapi, documentId);

        if (lesson.courseDocumentId !== initialLesson.courseDocumentId) {
          throw new NotFoundError("Lesson not found.");
        }

        await lockLessonForKeyShare(trx, lesson.documentId);
        await requireCourseEnrollment(strapi, user.id, lesson.courseDocumentId);

        const state = await getCourseCompletionState(
          strapi,
          user.id,
          lesson.courseDocumentId,
        );
        const alreadyCompleted = state.completedLessonIds.has(lesson.documentId);

        if (!alreadyCompleted) {
          const existing = await strapi.documents(PROGRESS_UID).findFirst({
            filters: {
              student: { id: user.id },
              lesson: { documentId: lesson.documentId },
            },
            fields: ["documentId"],
          });

          // Do not duplicate or silently accept an inconsistent legacy row.
          if (existing) {
            ctx.conflict("Existing LessonProgress is invalid.");
            return;
          }

          const missingPrerequisite = state.lessons.some(
            (previous) =>
              previous.order < lesson.order &&
              !state.completedLessonIds.has(previous.documentId),
          );

          if (missingPrerequisite) {
            ctx.conflict("Complete previous lessons first.");
            return;
          }

          await strapi.documents(PROGRESS_UID).create({
            data: {
              student: user.id,
              lesson: { documentId: lesson.documentId },
              course: { documentId: lesson.courseDocumentId },
            },
            fields: ["documentId"],
          });
          state.completedLessonIds.add(lesson.documentId);
        }

        return {
          lessonDocumentId: lesson.documentId,
          alreadyCompleted,
          progress: calculateProgress(
            state.totalLessons,
            state.completedLessonIds.size,
          ),
        };
      },
    );

    if (!result) {
      return;
    }

    const lesson = await strapi.contentAPI.sanitize.output(
      { documentId: result.lessonDocumentId },
      strapi.contentType(LESSON_UID),
      { auth: ctx.state.auth },
    );

    if (!isUnknownRecord(lesson) || typeof lesson.documentId !== "string") {
      throw new NotFoundError("Lesson not found.");
    }

    ctx.status = result.alreadyCompleted ? 200 : 201;
    return {
      data: {
        lesson: { documentId: lesson.documentId },
        completed: true,
        alreadyCompleted: result.alreadyCompleted,
        progress: result.progress,
      },
    };
  },

  async courseProgress(ctx) {
    const user = getStudentUser(ctx.state.user);
    const documentId = getCourseDocumentId(ctx.params);
    const progress = await strapi.db.transaction(
      async ({ trx }: { trx: Knex.Transaction }) => {
        await lockStudentForShare(trx, user.id);
        await lockCourseForShare(trx, documentId);
        await requireCourseEnrollment(strapi, user.id, documentId);

        const state = await getCourseCompletionState(strapi, user.id, documentId);
        return calculateProgress(
          state.totalLessons,
          state.completedLessonIds.size,
        );
      },
    );

    const course = await strapi.contentAPI.sanitize.output(
      { documentId },
      strapi.contentType(COURSE_UID),
      { auth: ctx.state.auth },
    );

    if (!isUnknownRecord(course) || typeof course.documentId !== "string") {
      throw new NotFoundError("Course not found.");
    }

    return { data: { course: { documentId: course.documentId }, ...progress } };
  },

  async courseLessons(ctx) {
    const user = getStudentUser(ctx.state.user);
    const documentId = getCourseDocumentId(ctx.params);
    const result = await strapi.db.transaction(
      async ({ trx }: { trx: Knex.Transaction }) => {
        await lockStudentForShare(trx, user.id);
        await lockCourseForShare(trx, documentId);
        await requireCourseEnrollment(strapi, user.id, documentId);

        const state = await getCourseCompletionState(strapi, user.id, documentId);
        const lessons = await strapi.documents(LESSON_UID).findMany({
          filters: { course: { documentId } },
          fields: ["documentId", "title", "content", "videoUrl", "order"],
          sort: "order:asc",
        });

        return { lessons, state };
      },
    );

    const sanitized = await strapi.contentAPI.sanitize.output(
      result.lessons,
      strapi.contentType(LESSON_UID),
      { auth: ctx.state.auth },
    );

    if (!Array.isArray(sanitized)) {
      throw new Error("Lesson sanitization returned an invalid collection.");
    }

    const lessons = sanitized.map((entry: unknown) => {
      const lesson = getLearningLessonData(entry);
      const locked = result.state.lessons.some(
        (previous) =>
          previous.order < lesson.order &&
          !result.state.completedLessonIds.has(previous.documentId),
      );

      return {
        documentId: lesson.documentId,
        title: lesson.title,
        order: lesson.order,
        completed: result.state.completedLessonIds.has(lesson.documentId),
        locked,
        content: locked ? null : lesson.content,
        videoUrl: locked ? null : lesson.videoUrl,
      };
    });

    return { data: { lessons } };
  },

  async learnLesson(ctx) {
    const user = getStudentUser(ctx.state.user);
    const documentId = getLessonDocumentId(ctx.params);
    const result = await strapi.db.transaction(
      async ({ trx }: { trx: Knex.Transaction }) => {
        await lockStudentForShare(trx, user.id);
        const initialLesson = await getCompletionLesson(strapi, documentId);
        await lockCourseForShare(trx, initialLesson.courseDocumentId);

        const lesson = await getCompletionLesson(strapi, documentId);

        if (lesson.courseDocumentId !== initialLesson.courseDocumentId) {
          throw new NotFoundError("Lesson not found.");
        }

        await requireCourseEnrollment(strapi, user.id, lesson.courseDocumentId);
        const state = await getCourseCompletionState(
          strapi,
          user.id,
          lesson.courseDocumentId,
        );
        const missingPrerequisite = state.lessons.some(
          (previous) =>
            previous.order < lesson.order &&
            !state.completedLessonIds.has(previous.documentId),
        );

        if (missingPrerequisite) {
          ctx.conflict("Complete previous lessons first.");
          return;
        }

        const entry = await strapi.documents(LESSON_UID).findOne({
          documentId,
          fields: ["documentId", "title", "content", "videoUrl", "order"],
        });

        if (!entry) {
          throw new NotFoundError("Lesson not found.");
        }

        return {
          lesson: entry,
          completed: state.completedLessonIds.has(documentId),
        };
      },
    );

    if (!result) {
      return;
    }

    const sanitized = await strapi.contentAPI.sanitize.output(
      result.lesson,
      strapi.contentType(LESSON_UID),
      { auth: ctx.state.auth },
    );
    const lesson = getLearningLessonData(sanitized);

    return { data: { lesson: { ...lesson, completed: result.completed } } };
  },
}));
