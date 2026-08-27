import type { Core, Data } from "@strapi/strapi";
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
const LESSON_PROGRESS_UID = "api::lesson-progress.lesson-progress";
const DUPLICATE_ORDER_MESSAGE =
  "A Lesson with this order already exists in the Course.";

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

function getPositiveLessonOrder(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new ValidationError(
      "Lesson order must be an integer greater than or equal to 1.",
    );
  }

  return value;
}

async function getExistingLessonCourseDocumentId(
  strapi: Core.Strapi,
  documentId: string,
): Promise<string> {
  const lesson = await strapi.documents(LESSON_UID).findOne({
    documentId,
    fields: ["documentId"],
    populate: { course: { fields: ["documentId"] } },
  });

  if (!lesson || !lesson.course) {
    throw new NotFoundError("Lesson not found");
  }

  return lesson.course.documentId;
}

async function lessonOrderExists(
  strapi: Core.Strapi,
  courseDocumentId: string,
  order: number,
  excludeDocumentId?: string,
): Promise<boolean> {
  const lesson = await strapi.documents(LESSON_UID).findFirst({
    filters: {
      course: { documentId: courseDocumentId },
      order,
      ...(excludeDocumentId ? { documentId: { $ne: excludeDocumentId } } : {}),
    },
    fields: ["documentId"],
  });

  return Boolean(lesson);
}

async function lockCourseForNoKeyUpdate(
  transaction: Knex.Transaction,
  documentId: string,
): Promise<void> {
  const course: unknown = await transaction("courses")
    .select("id")
    .where({ document_id: documentId })
    .forNoKeyUpdate()
    .first();

  if (!isUnknownRecord(course)) {
    throw new ValidationError("Selected Course was not found.");
  }
}

async function lockLessonForUpdate(
  transaction: Knex.Transaction,
  documentId: string,
): Promise<void> {
  const lesson: unknown = await transaction("lessons")
    .select("id")
    .where({ document_id: documentId })
    .forUpdate()
    .first();

  if (!isUnknownRecord(lesson)) {
    throw new NotFoundError("Lesson not found");
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
      const order = getPositiveLessonOrder(requestData.order);
      const lesson = await strapi.db.transaction(
        async ({ trx }: { trx: Knex.Transaction }) => {
          await lockCourseForNoKeyUpdate(trx, requestedCourseDocumentId);

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

          if (await lessonOrderExists(strapi, courseDocumentId, order)) {
            ctx.throw(409, DUPLICATE_ORDER_MESSAGE);
          }

          const data = getWritableLessonData(requestData);

          data.order = order;
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

      const order = hasOwnField(requestData, "order")
        ? getPositiveLessonOrder(requestData.order)
        : undefined;
      const documentId = getLessonDocumentId(ctx.params);
      const data = getWritableLessonData(requestData);
      let lesson: Data.ContentType<typeof LESSON_UID> | null;

      if (order === undefined) {
        lesson = await strapi.documents(LESSON_UID).update({ documentId, data });
      } else {
        const courseDocumentId = await getExistingLessonCourseDocumentId(
          strapi,
          documentId,
        );

        lesson = await strapi.db.transaction(
          async ({ trx }: { trx: Knex.Transaction }) => {
            await lockCourseForNoKeyUpdate(trx, courseDocumentId);

            if (
              (await getExistingLessonCourseDocumentId(strapi, documentId)) !==
              courseDocumentId
            ) {
              throw new NotFoundError("Lesson not found");
            }

            if (
              await lessonOrderExists(strapi, courseDocumentId, order, documentId)
            ) {
              ctx.throw(409, DUPLICATE_ORDER_MESSAGE);
            }

            return strapi.documents(LESSON_UID).update({ documentId, data });
          },
        );
      }

      if (!this.sanitizeOutput || !this.transformResponse) {
        throw new Error("Lesson controller response helpers are unavailable");
      }

      const sanitizedLesson = await this.sanitizeOutput(lesson, ctx);

      return this.transformResponse(sanitizedLesson);
    },

    async delete(ctx) {
      const documentId = getLessonDocumentId(ctx.params);
      const courseDocumentId = await getExistingLessonCourseDocumentId(
        strapi,
        documentId,
      );

      await strapi.db.transaction(
        async ({ trx }: { trx: Knex.Transaction }) => {
          await lockCourseForNoKeyUpdate(trx, courseDocumentId);

          if (
            (await getExistingLessonCourseDocumentId(strapi, documentId)) !==
            courseDocumentId
          ) {
            throw new NotFoundError("Lesson not found");
          }

          await lockLessonForUpdate(trx, documentId);

          const progress = await strapi.documents(LESSON_PROGRESS_UID).findFirst({
            filters: { lesson: { documentId } },
            fields: ["documentId"],
          });

          if (progress) {
            ctx.throw(
              409,
              "Lesson cannot be deleted because progress records exist.",
            );
          }

          await super.delete(ctx);
        },
      );
    },
  }),
);
