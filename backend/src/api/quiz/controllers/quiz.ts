import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import type { Knex } from "knex";
import {
  getAuthenticatedLmsUser,
  isUnknownRecord,
  LMS_ROLES,
} from "../../../utils/auth";
import {
  getOwnedQuizCourseDocumentId,
  getValidQuizCourseDocumentId,
} from "../utils/course";
import { validateQuizQuestions } from "../utils/questions";

const { ForbiddenError, NotFoundError, ValidationError } = errors;
const QUIZ_UID = "api::quiz.quiz";
const QUIZ_ATTEMPT_UID = "api::quiz-attempt.quiz-attempt";

function canManageAllQuizzes(roleName: string): boolean {
  return roleName === LMS_ROLES.ADMIN || roleName === LMS_ROLES.CONTENT_MANAGER;
}

function canWriteQuizzes(roleName: string): boolean {
  return canManageAllQuizzes(roleName) || roleName === LMS_ROLES.INSTRUCTOR;
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

function getWritableQuizData(
  requestData: Record<string, unknown>,
): Record<string, unknown> {
  const writableData: Record<string, unknown> = {};

  if (hasOwnField(requestData, "title")) {
    writableData.title = requestData.title;
  }

  if (hasOwnField(requestData, "questions")) {
    writableData.questions = validateQuizQuestions(requestData.questions);
  }

  return writableData;
}

function getQuizDocumentId(params: unknown): string {
  if (!isUnknownRecord(params) || typeof params.id !== "string") {
    throw new NotFoundError("Quiz not found");
  }

  return params.id;
}

function getCreateCourseDocumentId(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(
      "Quiz course must be a valid Course documentId.",
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

export default factories.createCoreController(QUIZ_UID, ({ strapi }) => ({
  async create(ctx) {
    const user = getAuthenticatedLmsUser(ctx.state.user);

    if (!user) {
      return ctx.unauthorized();
    }

    if (!canWriteQuizzes(user.roleName)) {
      throw new ForbiddenError("You cannot create Quizzes.");
    }

    const requestData = getRequestData(ctx.request.body);
    const requestedCourseDocumentId = getCreateCourseDocumentId(
      requestData.course,
    );
    const quiz = await strapi.db.transaction(
      async ({ trx }: { trx: Knex.Transaction }) => {
        await lockCourseForKeyShare(trx, requestedCourseDocumentId);

        const courseDocumentId =
          user.roleName === LMS_ROLES.INSTRUCTOR
            ? await getOwnedQuizCourseDocumentId(
                strapi,
                requestedCourseDocumentId,
                user.id,
              )
            : await getValidQuizCourseDocumentId(
                strapi,
                requestedCourseDocumentId,
              );
        const data = getWritableQuizData(requestData);

        if (!hasOwnField(data, "questions")) {
          throw new ValidationError("Quiz must contain at least one Question.");
        }

        data.course = { documentId: courseDocumentId };

        return strapi.service(QUIZ_UID).create({ data });
      },
    );

    if (!this.sanitizeOutput || !this.transformResponse) {
      throw new Error("Quiz controller response helpers are unavailable");
    }

    const sanitizedQuiz = await this.sanitizeOutput(quiz, ctx);

    ctx.status = 201;
    return this.transformResponse(sanitizedQuiz);
  },

  async update(ctx) {
    const user = getAuthenticatedLmsUser(ctx.state.user);

    if (!user) {
      return ctx.unauthorized();
    }

    if (!canWriteQuizzes(user.roleName)) {
      throw new ForbiddenError("You cannot update Quizzes.");
    }

    const requestData = getRequestData(ctx.request.body);

    if (hasOwnField(requestData, "course")) {
      throw new ValidationError(
        "A Quiz cannot be moved to another Course after creation.",
      );
    }

    const data = getWritableQuizData(requestData);
    const quiz = await strapi.documents(QUIZ_UID).update({
      documentId: getQuizDocumentId(ctx.params),
      data,
    });

    if (!this.sanitizeOutput || !this.transformResponse) {
      throw new Error("Quiz controller response helpers are unavailable");
    }

    const sanitizedQuiz = await this.sanitizeOutput(quiz, ctx);

    return this.transformResponse(sanitizedQuiz);
  },

  async delete(ctx) {
    const documentId = getQuizDocumentId(ctx.params);

    await strapi.db.transaction(
      async ({ trx }: { trx: Knex.Transaction }) => {
        const quiz: unknown = await trx("quizzes")
          .select("id")
          .where({ document_id: documentId })
          .forUpdate()
          .first();

        if (!isUnknownRecord(quiz)) {
          throw new NotFoundError("Quiz not found");
        }

        const attempt = await strapi.documents(QUIZ_ATTEMPT_UID).findFirst({
          filters: { quiz: { documentId } },
          fields: ["documentId"],
        });

        if (attempt) {
          ctx.conflict("Quiz cannot be deleted because attempt records exist.");
          return;
        }

        await super.delete(ctx);
      },
    );
  },
}));
