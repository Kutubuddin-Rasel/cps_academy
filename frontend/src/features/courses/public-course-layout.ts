export function publicCourseGridClassName(count: number): string {
  if (count <= 1) return "max-w-3xl";
  if (count === 2 || count === 4) return "grid gap-6 md:grid-cols-2";
  return "grid gap-6 md:grid-cols-2 xl:grid-cols-3";
}

export function shouldShowAllCoursesLink(totalCount: number, previewCount = 4): boolean {
  return totalCount > previewCount;
}
