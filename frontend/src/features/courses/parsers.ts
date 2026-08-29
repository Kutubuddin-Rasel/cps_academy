import { ApiError } from "@/lib/api/error";
import { isRecord } from "@/lib/api/response-guards";
import type {
  CourseSummary,
  EnrollmentSummary,
  PublicCourseDetail,
  PublicCourseSummary,
  PublicInstructor,
  SyllabusItem,
} from "./types";

function parseCourse(value: unknown): CourseSummary {
  if (!isRecord(value)
    || typeof value.documentId !== "string" || !value.documentId.trim()
    || typeof value.title !== "string" || !value.title.trim()
    || (value.description !== null && typeof value.description !== "string")) {
    throw new ApiError(502, "CPS Academy returned an invalid course. Please try again.");
  }
  return { documentId: value.documentId, title: value.title, description: value.description };
}

function parseEnrollment(value: unknown): EnrollmentSummary {
  if (!isRecord(value) || typeof value.documentId !== "string" || !value.documentId.trim()) {
    throw new ApiError(502, "CPS Academy returned an invalid enrollment. Please try again.");
  }
  return { documentId: value.documentId, course: parseCourse(value.course) };
}

function parsePublicInstructor(value: unknown): PublicInstructor | null {
  if (value === null) return null;
  if (!isRecord(value) || typeof value.username !== "string" || !value.username.trim()) {
    throw new ApiError(502, "CPS Academy returned an invalid instructor. Please try again.");
  }
  return { username: value.username };
}

function parsePublicCourse(value: unknown): PublicCourseSummary {
  const course = parseCourse(value);
  if (!isRecord(value)) {
    throw new ApiError(502, "CPS Academy returned an invalid public course. Please try again.");
  }
  return { ...course, instructor: parsePublicInstructor(value.instructor) };
}

function parseSyllabusItem(value: unknown): SyllabusItem {
  if (!isRecord(value) || !Number.isInteger(value.order) || typeof value.order !== "number" || value.order <= 0
    || typeof value.title !== "string" || !value.title.trim()) {
    throw new ApiError(502, "CPS Academy returned an invalid course syllabus. Please try again.");
  }
  return { order: value.order, title: value.title };
}

export function parseCourseList(payload: unknown): CourseSummary[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new ApiError(502, "CPS Academy returned an invalid course list. Please try again.");
  }
  return payload.data.map((value: unknown) => parseCourse(value));
}

export function parseCourseDetail(payload: unknown): CourseSummary {
  if (!isRecord(payload)) {
    throw new ApiError(502, "CPS Academy returned an invalid course. Please try again.");
  }
  return parseCourse(payload.data);
}

export function parseEnrollmentList(payload: unknown): EnrollmentSummary[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new ApiError(502, "CPS Academy returned an invalid enrollment list. Please try again.");
  }
  return payload.data.map((value: unknown) => parseEnrollment(value));
}

export function parseEnrollmentResponse(payload: unknown): EnrollmentSummary {
  if (!isRecord(payload)) {
    throw new ApiError(502, "CPS Academy returned an invalid enrollment. Please try again.");
  }
  return parseEnrollment(payload.data);
}

export function parsePublicCourseList(payload: unknown): PublicCourseSummary[] {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.courses)) {
    throw new ApiError(502, "CPS Academy returned an invalid public course list. Please try again.");
  }
  return payload.data.courses.map((value: unknown) => parsePublicCourse(value));
}

export function parsePublicCourseDetail(payload: unknown): PublicCourseDetail {
  if (!isRecord(payload) || !isRecord(payload.data) || !isRecord(payload.data.course)
    || !Array.isArray(payload.data.course.syllabus)) {
    throw new ApiError(502, "CPS Academy returned an invalid public course. Please try again.");
  }
  return {
    ...parsePublicCourse(payload.data.course),
    syllabus: payload.data.course.syllabus.map((value: unknown) => parseSyllabusItem(value)),
  };
}
