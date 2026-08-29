import { ApiError } from "@/lib/api/error";
import { isRecord } from "@/lib/api/response-guards";
import type { CourseLesson, CourseProgress, Lesson } from "./types";

function parseLessonIdentity(value: unknown) {
  if (!isRecord(value)
    || typeof value.documentId !== "string" || !value.documentId.trim()
    || typeof value.title !== "string" || !value.title.trim()
    || typeof value.order !== "number" || !Number.isInteger(value.order) || value.order < 1
    || typeof value.completed !== "boolean") {
    throw new ApiError(502, "CPS Academy returned an invalid lesson. Please try again.");
  }
  return { documentId: value.documentId, title: value.title, order: value.order, completed: value.completed };
}

export function parseCourseLessons(payload: unknown): CourseLesson[] {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.lessons)) {
    throw new ApiError(502, "CPS Academy returned an invalid lesson list. Please try again.");
  }
  return payload.data.lessons.map((value: unknown) => {
    if (!isRecord(value) || typeof value.locked !== "boolean") {
      throw new ApiError(502, "CPS Academy returned an invalid lesson status. Please try again.");
    }
    // Content is deliberately read only from the authorized lesson /learn endpoint.
    return { ...parseLessonIdentity(value), locked: value.locked };
  });
}

export function parseLessonResponse(payload: unknown): Lesson {
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.lesson)) {
    throw new ApiError(502, "CPS Academy returned an invalid lesson. Please try again.");
  }
  const lesson = payload.data.lesson;
  if ((lesson.content !== null && typeof lesson.content !== "string")
    || (lesson.videoUrl !== null && typeof lesson.videoUrl !== "string")) {
    throw new ApiError(502, "CPS Academy returned invalid lesson content. Please try again.");
  }
  return { ...parseLessonIdentity(lesson), content: lesson.content, videoUrl: lesson.videoUrl };
}

function parseProgress(value: unknown): CourseProgress {
  if (!isRecord(value)
    || typeof value.completedLessons !== "number" || !Number.isInteger(value.completedLessons) || value.completedLessons < 0
    || typeof value.totalLessons !== "number" || !Number.isInteger(value.totalLessons) || value.totalLessons < value.completedLessons
    || typeof value.percentage !== "number" || !Number.isFinite(value.percentage) || value.percentage < 0 || value.percentage > 100) {
    throw new ApiError(502, "CPS Academy returned invalid progress. Please try again.");
  }
  return { completedLessons: value.completedLessons, totalLessons: value.totalLessons, percentage: value.percentage };
}

export function parseCourseProgress(payload: unknown): CourseProgress {
  if (!isRecord(payload)) throw new ApiError(502, "CPS Academy returned invalid progress. Please try again.");
  return parseProgress(payload.data);
}

export function parseLessonCompletion(payload: unknown): CourseProgress {
  if (!isRecord(payload) || !isRecord(payload.data) || payload.data.completed !== true) {
    throw new ApiError(502, "CPS Academy could not confirm lesson completion. Please try again.");
  }
  return parseProgress(payload.data.progress);
}
