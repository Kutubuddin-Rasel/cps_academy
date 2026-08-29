import type { LmsRole } from "@/features/auth/types";
import { apiRequest } from "@/lib/api/request";
import { parseCourseStudentProgress, parseInstructors, parseManagedContent, parseManagedCourse, parseManagedCourses } from "./parsers";
import type { CourseInput, CourseStudentProgress, Instructor, LessonInput, ManagedContent, ManagedCourse, QuizInput } from "./types";

export async function getManagedCourses(token: string, signal: AbortSignal): Promise<ManagedCourse[]> {
  return parseManagedCourses(await apiRequest("/api/courses/manage", { token, signal }));
}

export async function getManagedCourse(courseId: string, token: string, signal: AbortSignal): Promise<ManagedCourse> {
  return parseManagedCourse(await apiRequest(`/api/courses/${encodeURIComponent(courseId)}`, { token, signal }));
}

export async function getManagedContent(courseId: string, token: string, signal: AbortSignal): Promise<ManagedContent> {
  return parseManagedContent(await apiRequest(`/api/courses/${encodeURIComponent(courseId)}/manage-content`, { token, signal }));
}

export async function getCourseStudentProgress(courseId: string, token: string, signal: AbortSignal): Promise<CourseStudentProgress> {
  return parseCourseStudentProgress(await apiRequest(`/api/courses/${encodeURIComponent(courseId)}/students-progress`, { token, signal }));
}

export async function getInstructors(token: string, signal: AbortSignal): Promise<Instructor[]> {
  return parseInstructors(await apiRequest("/api/instructors", { token, signal }));
}

function courseData(input: CourseInput, role: LmsRole | null) {
  const data: { title: string; description: string | null; instructor?: number } = {
    title: input.title, description: input.description,
  };
  if ((role === "Admin" || role === "Content Manager") && input.instructorId !== undefined) data.instructor = input.instructorId;
  return data;
}

export async function createCourse(input: CourseInput, role: LmsRole | null, token: string, signal: AbortSignal): Promise<ManagedCourse> {
  return parseManagedCourse(await apiRequest("/api/courses", { method: "POST", body: { data: courseData(input, role) }, token, signal }));
}

export async function updateCourse(courseId: string, input: CourseInput, role: LmsRole | null, token: string, signal: AbortSignal): Promise<void> {
  await apiRequest(`/api/courses/${encodeURIComponent(courseId)}`, { method: "PUT", body: { data: courseData(input, role) }, token, signal });
}

export async function deleteCourse(courseId: string, token: string, signal: AbortSignal): Promise<void> {
  await apiRequest(`/api/courses/${encodeURIComponent(courseId)}`, { method: "DELETE", token, signal });
}

function lessonData({ title, content, videoUrl, order }: LessonInput) {
  return { title, content, videoUrl, order };
}

export async function createLesson(courseId: string, input: LessonInput, token: string, signal: AbortSignal): Promise<void> {
  await apiRequest("/api/lessons", { method: "POST", body: { data: { ...lessonData(input), course: courseId } }, token, signal });
}

export async function updateLesson(lessonId: string, input: LessonInput, token: string, signal: AbortSignal): Promise<void> {
  await apiRequest(`/api/lessons/${encodeURIComponent(lessonId)}`, { method: "PUT", body: { data: lessonData(input) }, token, signal });
}

export async function deleteLesson(lessonId: string, token: string, signal: AbortSignal): Promise<void> {
  await apiRequest(`/api/lessons/${encodeURIComponent(lessonId)}`, { method: "DELETE", token, signal });
}

function quizData(input: QuizInput) {
  return {
    title: input.title,
    questions: input.questions.map(({ questionKey, prompt, correctOptionKey, options }) => ({
      questionKey, prompt, correctOptionKey,
      options: options.map(({ optionKey, text }) => ({ optionKey, text })),
    })),
  };
}

export async function createQuiz(courseId: string, input: QuizInput, token: string, signal: AbortSignal): Promise<void> {
  await apiRequest("/api/quizzes", { method: "POST", body: { data: { ...quizData(input), course: courseId } }, token, signal });
}

export async function updateQuiz(quizId: string, input: QuizInput, token: string, signal: AbortSignal): Promise<void> {
  await apiRequest(`/api/quizzes/${encodeURIComponent(quizId)}`, { method: "PUT", body: { data: quizData(input) }, token, signal });
}

export async function deleteQuiz(quizId: string, token: string, signal: AbortSignal): Promise<void> {
  await apiRequest(`/api/quizzes/${encodeURIComponent(quizId)}`, { method: "DELETE", token, signal });
}
