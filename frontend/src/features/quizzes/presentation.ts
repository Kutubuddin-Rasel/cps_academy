import type { QuizAttempt } from "./types";

export function newestQuizAttempt(attempts: readonly QuizAttempt[]): QuizAttempt | null {
  return attempts[0] ?? null;
}

export function formattedAttemptDate(value: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}
