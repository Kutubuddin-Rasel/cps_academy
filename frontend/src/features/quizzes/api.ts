import { apiRequest } from "@/lib/api/request";
import { parseCourseQuizzes, parseQuizAttempts, parseQuizSubmission, parseStudentQuiz } from "./parsers";
import type { QuizAnswer, QuizAttempt, QuizResult, QuizSummary, StudentQuiz } from "./types";

export async function getCourseQuizzes(courseId: string, token: string, signal: AbortSignal): Promise<QuizSummary[]> {
  return parseCourseQuizzes(await apiRequest(`/api/courses/${encodeURIComponent(courseId)}/quizzes`, { token, signal }));
}

export async function getStudentQuiz(quizId: string, token: string, signal: AbortSignal): Promise<StudentQuiz> {
  return parseStudentQuiz(await apiRequest(`/api/quizzes/${encodeURIComponent(quizId)}/take`, { token, signal }));
}

export async function submitQuiz(quizId: string, answers: QuizAnswer[], token: string, signal: AbortSignal): Promise<QuizResult> {
  return parseQuizSubmission(await apiRequest(`/api/quizzes/${encodeURIComponent(quizId)}/submit`, {
    method: "POST", token, signal,
    // This custom endpoint requires a root-level answers body, without a data wrapper.
    body: { answers: answers.map(({ questionKey, selectedOptionKey }) => ({ questionKey, selectedOptionKey })) },
  }));
}

export async function getQuizAttempts(quizId: string, token: string, signal: AbortSignal): Promise<QuizAttempt[]> {
  return parseQuizAttempts(await apiRequest(`/api/quizzes/${encodeURIComponent(quizId)}/attempts/me`, { token, signal }));
}
