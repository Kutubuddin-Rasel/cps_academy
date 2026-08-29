import { ApiError } from "@/lib/api/error";
import { isRecord } from "@/lib/api/response-guards";
import type { QuizAttempt, QuizOption, QuizQuestion, QuizResult, QuizSummary, StudentQuiz } from "./types";

function parseQuizSummary(value: unknown): QuizSummary {
  if (!isRecord(value)
    || typeof value.documentId !== "string" || !value.documentId.trim()
    || typeof value.title !== "string" || !value.title.trim()) {
    throw new ApiError(502, "CPS Academy returned an invalid quiz. Please try again.");
  }
  return { documentId: value.documentId, title: value.title };
}

export function parseCourseQuizzes(payload: unknown): QuizSummary[] {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.quizzes)) {
    throw new ApiError(502, "CPS Academy returned an invalid quiz list. Please try again.");
  }
  return payload.data.quizzes.map((value: unknown) => parseQuizSummary(value));
}

function parseOption(value: unknown): QuizOption {
  if (!isRecord(value)
    || typeof value.optionKey !== "string" || !value.optionKey.trim()
    || typeof value.text !== "string" || !value.text.trim()) {
    throw new ApiError(502, "CPS Academy returned an invalid quiz option. Please try again.");
  }
  return { optionKey: value.optionKey, text: value.text };
}

function parseQuestion(value: unknown): QuizQuestion {
  if (!isRecord(value)
    || typeof value.questionKey !== "string" || !value.questionKey.trim()
    || typeof value.prompt !== "string" || !value.prompt.trim()
    || !Array.isArray(value.options) || value.options.length < 2
    || "correctOptionKey" in value) {
    throw new ApiError(502, "CPS Academy returned an invalid student quiz question. Please try again.");
  }
  const options = value.options.map((option: unknown) => parseOption(option));
  if (new Set(options.map((option) => option.optionKey)).size !== options.length) {
    throw new ApiError(502, "CPS Academy returned duplicate quiz options. Please try again.");
  }
  return { questionKey: value.questionKey, prompt: value.prompt, options };
}

export function parseStudentQuiz(payload: unknown): StudentQuiz {
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.quiz)
    || !Array.isArray(payload.data.quiz.questions)) {
    throw new ApiError(502, "CPS Academy returned an invalid student quiz. Please try again.");
  }
  const quiz = payload.data.quiz;
  const questions = payload.data.quiz.questions.map((value: unknown) => parseQuestion(value));
  if (new Set(questions.map((question) => question.questionKey)).size !== questions.length) {
    throw new ApiError(502, "CPS Academy returned duplicate quiz questions. Please try again.");
  }
  return { ...parseQuizSummary(quiz), questions };
}

function parseResult(value: unknown): QuizResult {
  if (!isRecord(value)
    || typeof value.documentId !== "string" || !value.documentId.trim()
    || typeof value.score !== "number" || !Number.isInteger(value.score) || value.score < 0
    || typeof value.total !== "number" || !Number.isInteger(value.total) || value.total < 1 || value.score > value.total
    || typeof value.percentage !== "number" || !Number.isFinite(value.percentage) || value.percentage < 0 || value.percentage > 100) {
    throw new ApiError(502, "CPS Academy returned an invalid quiz result. Please try again.");
  }
  return { documentId: value.documentId, score: value.score, total: value.total, percentage: value.percentage };
}

export function parseQuizSubmission(payload: unknown): QuizResult {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new ApiError(502, "CPS Academy returned an invalid quiz result. Please try again.");
  }
  return parseResult(payload.data.attempt);
}

export function parseQuizAttempts(payload: unknown): QuizAttempt[] {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.attempts)) {
    throw new ApiError(502, "CPS Academy returned an invalid attempt history. Please try again.");
  }
  return payload.data.attempts.map((value: unknown) => {
    if (!isRecord(value) || typeof value.createdAt !== "string" || !Number.isFinite(Date.parse(value.createdAt))) {
      throw new ApiError(502, "CPS Academy returned an invalid attempt date. Please try again.");
    }
    return { ...parseResult(value), createdAt: value.createdAt };
  });
}
