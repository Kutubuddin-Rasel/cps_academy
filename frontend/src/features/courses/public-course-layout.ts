import type { PublicCourseSummary } from "./types";

export function publicCourseGridClassName(count: number): string {
  if (count <= 1) return "max-w-3xl";
  return "grid gap-6 md:grid-cols-2";
}

export function filterPublicCourses(courses: readonly PublicCourseSummary[], query: string): PublicCourseSummary[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) return [...courses];

  return courses.filter((course) => (
    course.title.toLowerCase().includes(normalizedQuery)
    || course.instructor?.username.toLowerCase().includes(normalizedQuery)
  ));
}

export function shouldShowAllCoursesLink(totalCount: number, previewCount = 4): boolean {
  return totalCount > previewCount;
}
