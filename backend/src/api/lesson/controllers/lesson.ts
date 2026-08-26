import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import type { Knex } from "knex";
import {
  getAuthenticatedLmsUser,
  isUnknownRecord,
  LMS_ROLES,
} from "../../../utils/auth";
import {
  getOwnedLessonCourseDocumentId,
  getValidLessonCourseDocumentId,
} from "../utils/course";

const { ForbiddenError, NotFoundError, ValidationError } = errors;
const LESSON_UID = "api::lesson.lesson";

function canManageAllLessons(roleName: string): boolean {
  return roleName === LMS_ROLES.ADMIN || roleName === LMS_ROLES.CONTENT_MANAGER;
}

function canWriteLessons(roleName: string): boolean {
  return canManageAllLessons(roleName) || roleName === LMS_ROLES.INSTRUCTOR;
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

function getWritableLessonData(
  requestData: Record<string, unknown>,
): Record<string, unknown> {
  const writableData: Record<string, unknown> = {};

  if (hasOwnField(requestData, "title")) {
    writableData.title = requestData.title;
  }

  if (hasOwnField(requestData, "content")) {
    writableData.content = requestData.content;
  }

  if (hasOwnField(requestData, "videoUrl")) {
    writableData.videoUrl = requestData.videoUrl;
  }

  if (hasOwnField(requestData, "order")) {
    writableData.order = requestData.order;
  }

  return writableData;
}

function getLessonDocumentId(params: unknown): string {
  if (!isUnknownRecord(params) || typeof params.id !== "string") {
    throw new NotFoundError("Lesson not found");
  }

  return params.id;
}

function getCreateCourseDocumentId(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ValidationError(
      "Lesson course must be a valid Course documentId.",
    );
  }

  return value;
}

async function lockCourseForKeyShare(
  transaction: Knex.Transaction,
  documentId: string,
): Promise<void> {
  const course: unknown = await transaction("courses")
    .select("id")
    .where({ document_id: documentId })
    .forKeyShare()
    .first();

  if (!isUnknownRecord(course)) {
    throw new ValidationError("Selected Course was not found.");
  }
}

export default factories.createCoreController(
  LESSON_UID,
  ({ strapi }) => ({
    async create(ctx) {
      const user = getAuthenticatedLmsUser(ctx.state.user);

      if (!user) {
        return ctx.unauthorized();
      }

      if (!canWriteLessons(user.roleName)) {
        throw new ForbiddenError("You cannot create Lessons.");
      }

      const requestData = getRequestData(ctx.request.body);
      const requestedCourseDocumentId = getCreateCourseDocumentId(
        requestData.course,
      );
      const lesson = await strapi.db.transaction(
        async ({ trx }: { trx: Knex.Transaction }) => {
          await lockCourseForKeyShare(trx, requestedCourseDocumentId);

          const courseDocumentId =
            user.roleName === LMS_ROLES.INSTRUCTOR
              ? await getOwnedLessonCourseDocumentId(
                  strapi,
                  requestedCourseDocumentId,
                  user.id,
                )
              : await getValidLessonCourseDocumentId(
                  strapi,
                  requestedCourseDocumentId,
                );
          const data = getWritableLessonData(requestData);

          data.course = { documentId: courseDocumentId };

          return strapi.service(LESSON_UID).create({ data });
        },
      );

      if (!this.sanitizeOutput || !this.transformResponse) {
        throw new Error("Lesson controller response helpers are unavailable");
      }

      const sanitizedLesson = await this.sanitizeOutput(lesson, ctx);

      ctx.status = 201;
      return this.transformResponse(sanitizedLesson);
    },

    async update(ctx) {
      const user = getAuthenticatedLmsUser(ctx.state.user);

      if (!user) {
        return ctx.unauthorized();
      }

      if (!canWriteLessons(user.roleName)) {
        throw new ForbiddenError("You cannot update Lessons.");
      }

      const requestData = getRequestData(ctx.request.body);
      const hasCourseField = hasOwnField(requestData, "course");

      if (hasCourseField) {
        throw new ValidationError(
          "A Lesson cannot be moved to another Course after creation.",
        );
      }

      const data = getWritableLessonData(requestData);

      const lesson = await strapi.documents(LESSON_UID).update({
        documentId: getLessonDocumentId(ctx.params),
        data,
      });

      if (!this.sanitizeOutput || !this.transformResponse) {
        throw new Error("Lesson controller response helpers are unavailable");
      }

      const sanitizedLesson = await this.sanitizeOutput(lesson, ctx);

      return this.transformResponse(sanitizedLesson);
    },
  }),
);
