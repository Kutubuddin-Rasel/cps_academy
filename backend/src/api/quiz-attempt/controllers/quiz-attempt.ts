import { factories } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import type { Knex } from "knex";
import {
  getAuthenticatedLmsUser,
  isUnknownRecord,
  LMS_ROLES,
} from "../../../utils/auth";
import { requireCourseEnrollment } from "../../lesson-progress/utils/progress";
import { validateQuizQuestions } from "../../quiz/utils/questions";
import {
  getAttemptSummary,
  getEnrolledQuiz,
  getQuizSummary,
  getSafeQuiz,
  getSubmissionAnswers,
  gradeQuiz,
} from "../utils/quiz";

const { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } =
  errors;
const ATTEMPT_UID = "api::quiz-attempt.quiz-attempt";
const QUIZ_UID = "api::quiz.quiz";

function getStudentUser(value: unknown) {
  const user = getAuthenticatedLmsUser(value);

  if (!user) {
    throw new UnauthorizedError("Authentication required.");
  }

  if (user.roleName !== LMS_ROLES.STUDENT) {
    throw new ForbiddenError("Only Students may access quiz-taking actions.");
  }

  return user;
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

function getQuizDocumentId(params: unknown): string {
  if (
    !isUnknownRecord(params) ||
    typeof params.quizDocumentId !== "string" ||
    params.quizDocumentId.trim().length === 0
  ) {
    throw new NotFoundError("Quiz not found.");
  }

  return params.quizDocumentId;
}

export default factories.createCoreController(ATTEMPT_UID, ({ strapi }) => ({
  async courseQuizzes(ctx) {
    const user = getStudentUser(ctx.state.user);
    const documentId = getCourseDocumentId(ctx.params);
    const course = await strapi.documents("api::course.course").findOne({
      documentId,
      fields: ["documentId"],
    });

    if (!course) {
      throw new NotFoundError("Course not found.");
    }

    await requireCourseEnrollment(strapi, user.id, course.documentId);
    const entries = await strapi.documents(QUIZ_UID).findMany({
      filters: { course: { documentId: course.documentId } },
      fields: ["documentId", "title"],
      sort: ["createdAt:asc", "id:asc"],
    });
    const sanitized = await strapi.contentAPI.sanitize.output(
      entries,
      strapi.contentType(QUIZ_UID),
      { auth: ctx.state.auth },
    );

    if (!Array.isArray(sanitized)) {
      throw new Error("Quiz sanitization returned an invalid collection.");
    }

    return { data: { quizzes: sanitized.map(getQuizSummary) } };
  },

  async take(ctx) {
    const user = getStudentUser(ctx.state.user);
    const documentId = getQuizDocumentId(ctx.params);
    await getEnrolledQuiz(strapi, user.id, documentId);

    // Correct answers are not selected; the final shape also excludes them.
    const quiz = await strapi.documents(QUIZ_UID).findOne({
      documentId,
      fields: ["documentId", "title"],
      populate: {
        questions: {
          fields: ["questionKey", "prompt"],
          populate: { options: { fields: ["optionKey", "text"] } },
        },
      },
    });
    const sanitized = await strapi.contentAPI.sanitize.output(
      quiz,
      strapi.contentType(QUIZ_UID),
      { auth: ctx.state.auth },
    );

    return { data: { quiz: getSafeQuiz(sanitized) } };
  },

  async submit(ctx) {
    const user = getStudentUser(ctx.state.user);
    const answers = getSubmissionAnswers(ctx.request.body);
    const documentId = getQuizDocumentId(ctx.params);
    const attempt = await strapi.db.transaction(
      async ({ trx }: { trx: Knex.Transaction }) => {
        // Pair with Quiz deletion's FOR UPDATE lock until the attempt commits.
        const lockedQuiz: unknown = await trx("quizzes")
          .select("id")
          .where({ document_id: documentId })
          .forKeyShare()
          .first();

        if (!isUnknownRecord(lockedQuiz)) {
          throw new NotFoundError("Quiz not found.");
        }

        const quiz = await getEnrolledQuiz(strapi, user.id, documentId);
        const authoritative = await strapi.documents(QUIZ_UID).findOne({
          documentId: quiz.documentId,
          fields: ["documentId"],
          populate: {
            questions: {
              fields: ["questionKey", "prompt", "correctOptionKey"],
              populate: { options: { fields: ["optionKey", "text"] } },
            },
          },
        });

        if (!authoritative) {
          throw new NotFoundError("Quiz not found.");
        }

        const questions = validateQuizQuestions(authoritative.questions);
        const result = gradeQuiz(questions, answers);

        return strapi.documents(ATTEMPT_UID).create({
          data: {
            student: user.id,
            quiz: { documentId: quiz.documentId },
            course: { documentId: quiz.courseDocumentId },
            score: result.score,
            total: result.total,
            answersSnapshot: result.answersSnapshot,
          },
          fields: ["documentId", "score", "total"],
        });
      },
    );

    if (!this.sanitizeOutput) {
      throw new Error("QuizAttempt controller response helper is unavailable");
    }

    const sanitized = await this.sanitizeOutput(attempt, ctx);
    ctx.status = 201;
    return { data: { attempt: getAttemptSummary(sanitized) } };
  },

  async myAttempts(ctx) {
    const user = getStudentUser(ctx.state.user);
    const documentId = getQuizDocumentId(ctx.params);
    const quiz = await getEnrolledQuiz(strapi, user.id, documentId);
    const entries = await strapi.documents(ATTEMPT_UID).findMany({
      filters: {
        student: { id: user.id },
        quiz: { documentId: quiz.documentId },
      },
      fields: ["documentId", "score", "total", "createdAt"],
      sort: ["createdAt:desc", "id:desc"],
    });

    if (!this.sanitizeOutput) {
      throw new Error("QuizAttempt controller response helper is unavailable");
    }

    const sanitized = await this.sanitizeOutput(entries, ctx);

    if (!Array.isArray(sanitized)) {
      throw new Error("QuizAttempt sanitization returned an invalid collection.");
    }

    const attempts = sanitized.map((entry: unknown) => {
      if (!isUnknownRecord(entry) || typeof entry.createdAt !== "string") {
        throw new ValidationError("QuizAttempt history is unavailable.");
      }

      return { ...getAttemptSummary(entry), createdAt: entry.createdAt };
    });

    return { data: { attempts } };
  },
}));
