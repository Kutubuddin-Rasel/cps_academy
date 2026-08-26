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
  }),
);
