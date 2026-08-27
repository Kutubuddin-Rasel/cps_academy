import type { Core, Data } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import { isUnknownRecord } from "../../../utils/auth";
import { requireCourseEnrollment } from "../../lesson-progress/utils/progress";
import { validateQuizQuestions } from "../../quiz/utils/questions";

const { NotFoundError, ValidationError } = errors;

type QuizAnswer = {
  questionKey: string;
  selectedOptionKey: string;
};

export async function getEnrolledQuiz(
  strapi: Core.Strapi,
  studentId: Data.ID,
  documentId: string,
) {
  const quiz = await strapi.documents("api::quiz.quiz").findOne({
    documentId,
    fields: ["documentId"],
    populate: { course: { fields: ["documentId"] } },
  });

  if (!quiz || !quiz.course?.documentId) {
    throw new NotFoundError("Quiz not found.");
  }

  await requireCourseEnrollment(strapi, studentId, quiz.course.documentId);

  return {
    documentId: quiz.documentId,
    courseDocumentId: quiz.course.documentId,
  };
}

export function getSubmissionAnswers(body: unknown): QuizAnswer[] {
  if (
    !isUnknownRecord(body) ||
    Object.keys(body).some((key) => key !== "answers") ||
    !Array.isArray(body.answers)
  ) {
    throw new ValidationError(
      "Submit only an answers array. Identity and grading data are server-controlled.",
    );
  }

  const answers: QuizAnswer[] = [];
  const questionKeys = new Set<string>();

  for (const answer of body.answers) {
    if (
      !isUnknownRecord(answer) ||
      Object.keys(answer).some(
        (key) => key !== "questionKey" && key !== "selectedOptionKey",
      ) ||
      typeof answer.questionKey !== "string" ||
      answer.questionKey.trim().length === 0 ||
      typeof answer.selectedOptionKey !== "string" ||
      answer.selectedOptionKey.trim().length === 0
    ) {
      throw new ValidationError(
        "Each answer must contain only a non-empty questionKey and selectedOptionKey.",
      );
    }

    if (questionKeys.has(answer.questionKey)) {
      throw new ValidationError("Submit exactly one answer per Question.");
    }

    questionKeys.add(answer.questionKey);
    answers.push({
      questionKey: answer.questionKey,
      selectedOptionKey: answer.selectedOptionKey,
    });
  }

  return answers;
}

export function gradeQuiz(
  questions: ReturnType<typeof validateQuizQuestions>,
  answers: QuizAnswer[],
) {
  const questionKeys = new Set(questions.map((question) => question.questionKey));

  if (
    answers.length !== questions.length ||
    answers.some((answer) => !questionKeys.has(answer.questionKey))
  ) {
    throw new ValidationError("Submit exactly one answer for every Quiz Question.");
  }

  const selections = new Map(
    answers.map((answer) => [answer.questionKey, answer.selectedOptionKey]),
  );
  const snapshotQuestions = questions.map((question) => {
    const selectedOptionKey = selections.get(question.questionKey);

    if (
      selectedOptionKey === undefined ||
      !question.options.some((option) => option.optionKey === selectedOptionKey)
    ) {
      throw new ValidationError("Selected option must belong to its Question.");
    }

    return {
      questionKey: question.questionKey,
      prompt: question.prompt,
      options: question.options.map((option) => ({
        optionKey: option.optionKey,
        text: option.text,
      })),
      selectedOptionKey,
      correctOptionKey: question.correctOptionKey,
      isCorrect: selectedOptionKey === question.correctOptionKey,
    };
  });

  return {
    score: snapshotQuestions.filter((question) => question.isCorrect).length,
    total: questions.length,
    answersSnapshot: { questions: snapshotQuestions },
  };
}

export function getQuizSummary(value: unknown) {
  if (
    !isUnknownRecord(value) ||
    typeof value.documentId !== "string" ||
    typeof value.title !== "string"
  ) {
    throw new NotFoundError("Quiz not found.");
  }

  return { documentId: value.documentId, title: value.title };
}

export function getSafeQuiz(value: unknown) {
  const quiz = getQuizSummary(value);

  if (!isUnknownRecord(value) || !Array.isArray(value.questions)) {
    throw new ValidationError("Quiz questions are unavailable.");
  }

  const questions = value.questions.map((question: unknown) => {
    if (
      !isUnknownRecord(question) ||
      typeof question.questionKey !== "string" ||
      typeof question.prompt !== "string" ||
      !Array.isArray(question.options)
    ) {
      throw new ValidationError("Quiz questions are unavailable.");
    }

    const options = question.options.map((option: unknown) => {
      if (
        !isUnknownRecord(option) ||
        typeof option.optionKey !== "string" ||
        typeof option.text !== "string"
      ) {
        throw new ValidationError("Quiz options are unavailable.");
      }

      return { optionKey: option.optionKey, text: option.text };
    });

    return { questionKey: question.questionKey, prompt: question.prompt, options };
  });

  return { ...quiz, questions };
}

export function getAttemptSummary(value: unknown) {
  if (
    !isUnknownRecord(value) ||
    typeof value.documentId !== "string" ||
    typeof value.score !== "number" ||
    typeof value.total !== "number"
  ) {
    throw new ValidationError("QuizAttempt result is unavailable.");
  }

  return {
    documentId: value.documentId,
    score: value.score,
    total: value.total,
    percentage: value.total === 0 ? 0 : Math.round((value.score / value.total) * 100),
  };
}
