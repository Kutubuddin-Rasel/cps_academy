import { ApiError } from "@/lib/api/error";
import { isRecord } from "@/lib/api/response-guards";
import type { CourseStudentProgress, Instructor, ManagedContent, ManagedCourse, ManagedLesson, ManagedQuiz, StaffQuizQuestion } from "./types";

function parseDocumentTitle(value: unknown): { documentId: string; title: string } {
  if (!isRecord(value)
    || typeof value.documentId !== "string" || !value.documentId.trim()
    || typeof value.title !== "string" || !value.title.trim()) {
    throw new ApiError(502, "CPS Academy returned invalid management data. Please try again.");
  }
  return { documentId: value.documentId, title: value.title };
}

function parseCourse(value: unknown): ManagedCourse {
  if (!isRecord(value) || (value.description !== null && typeof value.description !== "string")) {
    throw new ApiError(502, "CPS Academy returned an invalid course. Please try again.");
  }
  return { ...parseDocumentTitle(value), description: value.description };
}

export function parseManagedCourses(payload: unknown): ManagedCourse[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new ApiError(502, "CPS Academy returned an invalid course list. Please try again.");
  }
  return payload.data.map((value: unknown) => parseCourse(value));
}

export function parseManagedCourse(payload: unknown): ManagedCourse {
  if (!isRecord(payload)) throw new ApiError(502, "CPS Academy returned an invalid course. Please try again.");
  return parseCourse(payload.data);
}

export function parseInstructors(payload: unknown): Instructor[] {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.instructors)) {
    throw new ApiError(502, "CPS Academy returned an invalid instructor directory. Please try again.");
  }
  return payload.data.instructors.map((value: unknown) => {
    if (!isRecord(value)
      || typeof value.id !== "number" || !Number.isSafeInteger(value.id) || value.id < 1
      || typeof value.username !== "string" || !value.username.trim()) {
      throw new ApiError(502, "CPS Academy returned an invalid instructor. Please try again.");
    }
    return { id: value.id, username: value.username };
  });
}

function parseLesson(value: unknown): ManagedLesson {
  if (!isRecord(value)
    || typeof value.order !== "number" || !Number.isInteger(value.order) || value.order < 1
    || (value.content !== null && typeof value.content !== "string")
    || (value.videoUrl !== null && typeof value.videoUrl !== "string")) {
    throw new ApiError(502, "CPS Academy returned invalid lesson authoring data. Please try again.");
  }
  return { ...parseDocumentTitle(value), order: value.order, content: value.content, videoUrl: value.videoUrl };
}

function parseQuestion(value: unknown): StaffQuizQuestion {
  if (!isRecord(value)
    || typeof value.questionKey !== "string" || !value.questionKey.trim() || value.questionKey !== value.questionKey.trim()
    || typeof value.prompt !== "string" || !value.prompt.trim()
    || typeof value.correctOptionKey !== "string"
    || !Array.isArray(value.options) || value.options.length < 2) {
    throw new ApiError(502, "CPS Academy returned invalid quiz authoring data. Please try again.");
  }
  const options = value.options.map((option: unknown) => {
    if (!isRecord(option)
      || typeof option.optionKey !== "string" || !option.optionKey.trim() || option.optionKey !== option.optionKey.trim()
      || typeof option.text !== "string" || !option.text.trim()) {
      throw new ApiError(502, "CPS Academy returned an invalid quiz option. Please try again.");
    }
    return { optionKey: option.optionKey, text: option.text };
  });
  if (new Set(options.map((option) => option.optionKey)).size !== options.length
    || !options.some((option) => option.optionKey === value.correctOptionKey)) {
    throw new ApiError(502, "CPS Academy returned an invalid quiz answer key. Please try again.");
  }
  return { questionKey: value.questionKey, prompt: value.prompt, correctOptionKey: value.correctOptionKey, options };
}

function parseQuiz(value: unknown): ManagedQuiz {
  if (!isRecord(value) || !Array.isArray(value.questions)) {
    throw new ApiError(502, "CPS Academy returned invalid quiz authoring data. Please try again.");
  }
  const questions = value.questions.map((question: unknown) => parseQuestion(question));
  if (new Set(questions.map((question) => question.questionKey)).size !== questions.length) {
    throw new ApiError(502, "CPS Academy returned duplicate quiz question keys. Please try again.");
  }
  return { ...parseDocumentTitle(value), questions };
}

export function parseManagedContent(payload: unknown): ManagedContent {
  if (!isRecord(payload) || !isRecord(payload.data)
    || !Array.isArray(payload.data.lessons) || !Array.isArray(payload.data.quizzes)) {
    throw new ApiError(502, "CPS Academy returned invalid course management data. Please try again.");
  }
  return {
    course: parseDocumentTitle(payload.data.course),
    lessons: payload.data.lessons.map((value: unknown) => parseLesson(value)),
    quizzes: payload.data.quizzes.map((value: unknown) => parseQuiz(value)),
  };
}

export function parseCourseStudentProgress(payload: unknown): CourseStudentProgress {
  const message = "CPS Academy returned invalid student progress. Please try again.";
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.course)
    || typeof payload.data.course.documentId !== "string" || !payload.data.course.documentId.trim()
    || !Array.isArray(payload.data.students)) {
    throw new ApiError(502, message);
  }
  const students = payload.data.students.map((value: unknown) => {
    if (!isRecord(value) || !isRecord(value.student)
      || typeof value.student.id !== "number" || !Number.isSafeInteger(value.student.id) || value.student.id < 1
      || typeof value.student.username !== "string" || !value.student.username.trim()
      || typeof value.completedLessons !== "number" || !Number.isSafeInteger(value.completedLessons) || value.completedLessons < 0
      || typeof value.totalLessons !== "number" || !Number.isSafeInteger(value.totalLessons) || value.totalLessons < value.completedLessons
      || typeof value.percentage !== "number" || !Number.isFinite(value.percentage) || value.percentage < 0 || value.percentage > 100) {
      throw new ApiError(502, message);
    }
    return {
      student: { id: value.student.id, username: value.student.username },
      completedLessons: value.completedLessons,
      totalLessons: value.totalLessons,
      percentage: value.percentage,
    };
  });
  return { course: { documentId: payload.data.course.documentId }, students };
}
