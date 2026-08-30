import type { CourseLesson } from "./types";

export type LessonPresentationState = "completed" | "current" | "locked";
export type ProgressPresentationTone = "neutral" | "partial" | "complete";

export function lessonPresentationState(lesson: Pick<CourseLesson, "completed" | "locked">): LessonPresentationState {
  if (lesson.completed) return "completed";
  return lesson.locked ? "locked" : "current";
}

export function findAvailableLesson<T extends Pick<CourseLesson, "documentId" | "completed" | "locked">>(
  lessons: readonly T[],
  excludedLessonId?: string,
): T | null {
  return lessons.find((lesson) => (
    lesson.documentId !== excludedLessonId && !lesson.completed && !lesson.locked
  )) ?? null;
}

export function progressPresentation(percentage: number): {
  label: string;
  tone: ProgressPresentationTone;
  textClassName: string;
  barClassName: string;
} {
  if (percentage >= 100) {
    return { label: "Complete", tone: "complete", textClassName: "text-emerald-800", barClassName: "bg-emerald-600" };
  }
  if (percentage > 0) {
    return { label: "In progress", tone: "partial", textClassName: "text-blue-800", barClassName: "bg-blue-700" };
  }
  return { label: "Not started", tone: "neutral", textClassName: "text-slate-600", barClassName: "bg-slate-500" };
}
