import type { Core } from "@strapi/strapi";
import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import type { Knex } from "knex";
import {
  getAuthenticatedLmsUser,
  isUnknownRecord,
  LMS_ROLES,
} from "../../../utils/auth";
import { getValidInstructorId } from "../utils/instructor";

const { ForbiddenError, NotFoundError, ValidationError } = errors;
const COURSE_UID = "api::course.course";
const ENROLLMENT_UID = "api::enrollment.enrollment";
const LESSON_PROGRESS_UID = "api::lesson-progress.lesson-progress";
const LESSON_UID = "api::lesson.lesson";
const QUIZ_ATTEMPT_UID = "api::quiz-attempt.quiz-attempt";
const QUIZ_UID = "api::quiz.quiz";

function canManageAllCourses(roleName: string): boolean {
  return roleName === LMS_ROLES.ADMIN || roleName === LMS_ROLES.CONTENT_MANAGER;
}

function canWriteCourses(roleName: string): boolean {
  return canManageAllCourses(roleName) || roleName === LMS_ROLES.INSTRUCTOR;
}

function getRequestData(body: unknown): Record<string, unknown> {
  if (!isUnknownRecord(body) || !isUnknownRecord(body.data)) {
    throw new ValidationError('Missing "data" payload in the request body');
  }

  return body.data;
}

function hasOwnField(data: Record<string, unknown>, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(data, field);
}

function getWritableCourseData(
  requestData: Record<string, unknown>,
): Record<string, unknown> {
  const writableData: Record<string, unknown> = {};

  if (hasOwnField(requestData, "title")) {
    writableData.title = requestData.title;
  }

  if (hasOwnField(requestData, "description")) {
    writableData.description = requestData.description;
  }

  return writableData;
}

function getCourseDocumentId(params: unknown): string {
  if (!isUnknownRecord(params) || typeof params.id !== "string") {
    throw new NotFoundError("Course not found");
  }

  return params.id;
}

function getCatalogDocumentId(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new NotFoundError("Course not found");
  }

  return value;
}

function publicInstructor(
  instructor: { username?: string | null } | null | undefined,
) {
  return instructor?.username ? { username: instructor.username } : null;
}

async function lockCourseForUpdate(
  transaction: Knex.Transaction,
  documentId: string,
): Promise<boolean> {
  const course: unknown = await transaction("courses")
    .select("id")
    .where({ document_id: documentId })
    .forUpdate()
    .first();

  return isUnknownRecord(course);
}

async function courseHasDependents(
  strapi: Core.Strapi,
  documentId: string,
): Promise<boolean> {
  const lesson = await strapi.documents(LESSON_UID).findFirst({
    filters: { course: { documentId } },
    fields: ["documentId"],
  });

  if (lesson) {
    return true;
  }

  const quiz = await strapi.documents(QUIZ_UID).findFirst({
    filters: { course: { documentId } },
    fields: ["documentId"],
  });

  if (quiz) {
    return true;
  }

  const enrollment = await strapi.documents(ENROLLMENT_UID).findFirst({
    filters: { course: { documentId } },
    fields: ["documentId"],
  });

  if (enrollment) {
    return true;
  }

  const lessonProgress = await strapi
    .documents(LESSON_PROGRESS_UID)
    .findFirst({
      filters: { course: { documentId } },
      fields: ["documentId"],
    });

  if (lessonProgress) {
    return true;
  }

  const quizAttempt = await strapi.documents(QUIZ_ATTEMPT_UID).findFirst({
    filters: { course: { documentId } },
    fields: ["documentId"],
  });

  return Boolean(quizAttempt);
}

export default factories.createCoreController(
  "api::course.course",
  ({ strapi }) => ({
    async catalog(ctx) {
      const courses = await strapi.documents(COURSE_UID).findMany({
        fields: ["documentId", "title", "description"],
        populate: { instructor: { fields: ["username"] } },
        sort: ["title:asc", "id:asc"],
      });

      ctx.body = {
        data: {
          courses: courses.map((course) => ({
            documentId: course.documentId,
            title: course.title,
            description: course.description ?? null,
            instructor: publicInstructor(course.instructor),
          })),
        },
      };
      ctx.status = 200;
    },

    async catalogDetail(ctx) {
      const documentId = getCatalogDocumentId(ctx.params.courseDocumentId);
      const course = await strapi.documents(COURSE_UID).findOne({
        documentId,
        fields: ["documentId", "title", "description"],
        populate: { instructor: { fields: ["username"] } },
      });

      if (!course) {
        throw new NotFoundError("Course not found");
      }

      const lessons = await strapi.documents(LESSON_UID).findMany({
        filters: { course: { documentId } },
        fields: ["title", "order"],
        sort: ["order:asc", "id:asc"],
      });

      ctx.body = {
        data: {
          course: {
            documentId: course.documentId,
            title: course.title,
            description: course.description ?? null,
            instructor: publicInstructor(course.instructor),
            syllabus: lessons.map((lesson) => ({
              order: lesson.order,
              title: lesson.title,
            })),
          },
        },
      };
      ctx.status = 200;
    },

    async manageList(ctx) {
      const user = getAuthenticatedLmsUser(ctx.state.user);

      if (!user || !canWriteCourses(user.roleName)) {
        throw new ForbiddenError("Access denied.");
      }

      // Ownership comes from the authenticated request, never Content API filters.
      const courses = await strapi.documents(COURSE_UID).findMany({
        filters: user.roleName === LMS_ROLES.INSTRUCTOR
          ? { instructor: { id: user.id } }
          : {},
        fields: ["documentId", "title", "description"],
        sort: ["title:asc", "id:asc"],
      });

      ctx.body = {
        data: courses.map((course) => ({
          documentId: course.documentId,
          title: course.title,
          description: course.description ?? null,
        })),
      };
      ctx.status = 200;
    },

    async create(ctx) {
      const user = getAuthenticatedLmsUser(ctx.state.user);

      if (!user) {
        return ctx.unauthorized();
      }

      if (!canWriteCourses(user.roleName)) {
        throw new ForbiddenError("You cannot create courses.");
      }

      const requestData = getRequestData(ctx.request.body);
      const data = getWritableCourseData(requestData);

      if (user.roleName === LMS_ROLES.INSTRUCTOR) {
        data.instructor = user.id;
      } else {
        data.instructor = await getValidInstructorId(
          strapi,
          requestData.instructor,
        );
      }

      const course = await strapi.service(COURSE_UID).create({ data });

      if (!this.sanitizeOutput || !this.transformResponse) {
        throw new Error("Course controller response helpers are unavailable");
      }

      const sanitizedCourse = await this.sanitizeOutput(course, ctx);

      ctx.status = 201;
      return this.transformResponse(sanitizedCourse);
    },

    async update(ctx) {
      const user = getAuthenticatedLmsUser(ctx.state.user);

      if (!user) {
        return ctx.unauthorized();
      }

      if (!canWriteCourses(user.roleName)) {
        throw new ForbiddenError("You cannot update courses.");
      }

      const requestData = getRequestData(ctx.request.body);
      const isChangingInstructor = hasOwnField(requestData, "instructor");

      if (user.roleName === LMS_ROLES.INSTRUCTOR && isChangingInstructor) {
        throw new ForbiddenError(
          "Instructors cannot reassign course ownership.",
        );
      }

      const data = getWritableCourseData(requestData);

      if (canManageAllCourses(user.roleName) && isChangingInstructor) {
        data.instructor = await getValidInstructorId(
          strapi,
          requestData.instructor,
        );
      }

      const course = await strapi.documents(COURSE_UID).update({
        documentId: getCourseDocumentId(ctx.params),
        data,
      });

      if (!this.sanitizeOutput || !this.transformResponse) {
        throw new Error("Course controller response helpers are unavailable");
      }

      const sanitizedCourse = await this.sanitizeOutput(course, ctx);

      return this.transformResponse(sanitizedCourse);
    },

    async delete(ctx) {
      const documentId = getCourseDocumentId(ctx.params);

      await strapi.db.transaction(
        async ({ trx }: { trx: Knex.Transaction }) => {
          const courseExists = await lockCourseForUpdate(trx, documentId);

          if (!courseExists) {
            throw new NotFoundError("Course not found");
          }

          if (await courseHasDependents(strapi, documentId)) {
            ctx.conflict(
              "Course cannot be deleted because dependent records exist.",
            );
            return;
          }

          await super.delete(ctx);
        },
      );
    },

    async manageContent(ctx) {
      const user = getAuthenticatedLmsUser(ctx.state.user);
      if (!user) {
        throw new ForbiddenError("Authentication required.");
      }

      const { courseDocumentId } = ctx.params;
      if (!courseDocumentId) {
        throw new ValidationError("Missing courseDocumentId");
      }

      if (
        user.roleName !== LMS_ROLES.ADMIN &&
        user.roleName !== LMS_ROLES.CONTENT_MANAGER &&
        user.roleName !== LMS_ROLES.INSTRUCTOR
      ) {
        throw new ForbiddenError("Access denied.");
      }

      const course = await strapi.documents(COURSE_UID).findFirst({
        filters: { documentId: courseDocumentId },
        fields: ["documentId", "title"],
        populate: { instructor: { fields: ["id"] } }
      });

      if (!course) {
        throw new NotFoundError("Course not found");
      }

      if (user.roleName === LMS_ROLES.INSTRUCTOR && course.instructor?.id !== user.id) {
        throw new ForbiddenError("You can only manage your own courses.");
      }

      const lessons = await strapi.documents(LESSON_UID).findMany({
        filters: { course: { documentId: courseDocumentId } },
        fields: ["documentId", "title", "content", "videoUrl", "order"],
        sort: ["order:asc", "id:asc"],
      });

      const quizzes = await strapi.documents(QUIZ_UID).findMany({
        filters: { course: { documentId: courseDocumentId } },
        fields: ["documentId", "title"],
        populate: {
          questions: {
            fields: ["questionKey", "prompt", "correctOptionKey"],
            populate: {
              options: {
                fields: ["optionKey", "text"]
              }
            }
          }
        },
        sort: ["id:asc"]
      });

      ctx.body = {
        data: {
          course: {
            documentId: course.documentId,
            title: course.title
          },
          lessons: lessons.map((l: { documentId: string; title?: string | null; content?: string | null; videoUrl?: string | null; order?: number | null }) => ({
            documentId: l.documentId,
            title: l.title,
            content: l.content,
            videoUrl: l.videoUrl,
            order: l.order
          })),
          quizzes: quizzes.map((q: { documentId: string; title?: string | null; questions?: { questionKey?: string | null; prompt?: string | null; correctOptionKey?: string | null; options?: { optionKey?: string | null; text?: string | null }[] | null }[] | null }) => ({
            documentId: q.documentId,
            title: q.title,
            questions: (q.questions || []).map((question) => ({
              questionKey: question.questionKey,
              prompt: question.prompt,
              correctOptionKey: question.correctOptionKey,
              options: (question.options || []).map((opt) => ({
                optionKey: opt.optionKey,
                text: opt.text
              }))
            }))
          }))
        }
      };
    },
  }),
);
