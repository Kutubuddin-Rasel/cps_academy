import type { CourseProgress } from "@/features/learning/types";
import type { EnrollmentSummary } from "./types";

export interface StudentCourseResume {
  enrollment: EnrollmentSummary;
  progress: CourseProgress | null;
}

export function buildStudentCourseResumes(
  enrollments: readonly EnrollmentSummary[],
  progressResults: readonly PromiseSettledResult<CourseProgress>[],
): StudentCourseResume[] {
  return enrollments.map((enrollment, index) => {
    const result = progressResults[index];
    return {
      enrollment,
      progress: result?.status === "fulfilled" ? result.value : null,
    };
  });
}
