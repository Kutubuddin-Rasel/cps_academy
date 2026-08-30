import { apiRequest, publicApiRequest } from "@/lib/api/request";
import {
  parseCourseDetail,
  parseCourseList,
  parseEnrollmentList,
  parseEnrollmentResponse,
  parsePublicCourseDetail,
  parsePublicCourseList,
} from "./parsers";
import type { CourseSummary, EnrollmentSummary, PublicCourseDetail, PublicCourseSummary } from "./types";

export async function getCourses(token: string, signal: AbortSignal): Promise<CourseSummary[]> {
  return parseCourseList(await apiRequest("/api/courses", { token, signal }));
}

export async function getCourse(courseId: string, token: string, signal: AbortSignal): Promise<CourseSummary> {
  return parseCourseDetail(await apiRequest(`/api/courses/${encodeURIComponent(courseId)}`, { token, signal }));
}

export async function getEnrollments(token: string, signal: AbortSignal): Promise<EnrollmentSummary[]> {
  return parseEnrollmentList(await apiRequest("/api/enrollments/me", { token, signal }));
}

export async function enrollInCourse(courseId: string, token: string, signal: AbortSignal): Promise<EnrollmentSummary> {
  return parseEnrollmentResponse(await apiRequest(`/api/courses/${encodeURIComponent(courseId)}/enroll`, {
    method: "POST", token, signal,
  }));
}

export async function getPublicCourses(signal: AbortSignal): Promise<PublicCourseSummary[]> {
  return parsePublicCourseList(await publicApiRequest("/api/catalog/courses", signal));
}

export async function getPublicCourse(courseId: string, signal: AbortSignal): Promise<PublicCourseDetail> {
  return parsePublicCourseDetail(await publicApiRequest(`/api/catalog/courses/${encodeURIComponent(courseId)}`, signal));
}
