import { apiRequest } from "@/lib/api/request";
import { parseCourseLessons, parseCourseProgress, parseLessonCompletion, parseLessonResponse } from "./parsers";
import type { CourseLesson, CourseProgress, Lesson } from "./types";

export async function getCourseLessons(courseId: string, token: string, signal: AbortSignal): Promise<CourseLesson[]> {
  return parseCourseLessons(await apiRequest(`/api/courses/${encodeURIComponent(courseId)}/lessons`, { token, signal }));
}

export async function getCourseProgress(courseId: string, token: string, signal: AbortSignal): Promise<CourseProgress> {
  return parseCourseProgress(await apiRequest(`/api/courses/${encodeURIComponent(courseId)}/progress`, { token, signal }));
}

export async function getLesson(lessonId: string, token: string, signal: AbortSignal): Promise<Lesson> {
  return parseLessonResponse(await apiRequest(`/api/lessons/${encodeURIComponent(lessonId)}/learn`, { token, signal }));
}

export async function completeLesson(lessonId: string, token: string, signal: AbortSignal): Promise<CourseProgress> {
  return parseLessonCompletion(await apiRequest(`/api/lessons/${encodeURIComponent(lessonId)}/complete`, {
    method: "POST", token, signal,
  }));
}
