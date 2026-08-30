import type { CourseProgress } from "@/features/learning/types";
import type { EnrollmentSummary } from "./types";

export interface StudentCourseResume {
  enrollment: EnrollmentSummary;
  progress: CourseProgress | null;
}

export interface StudentCourseGroups {
  inProgress: StudentCourseResume[];
  notStarted: StudentCourseResume[];
  completed: StudentCourseResume[];
  unavailable: StudentCourseResume[];
}

export function studentCourseActionLabel(progress: Pick<CourseProgress, "percentage"> | null): string {
  if (progress === null) return "Open course";
  if (progress.percentage >= 100) return "Review course";
  if (progress.percentage > 0) return "Continue learning";
  return "Start learning";
}

export function groupStudentCourseResumes(courses: readonly StudentCourseResume[]): StudentCourseGroups {
  const groups: StudentCourseGroups = { inProgress: [], notStarted: [], completed: [], unavailable: [] };

  for (const course of courses) {
    if (course.progress === null) groups.unavailable.push(course);
    else if (course.progress.percentage >= 100) groups.completed.push(course);
    else if (course.progress.percentage > 0) groups.inProgress.push(course);
    else groups.notStarted.push(course);
  }

  return groups;
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
