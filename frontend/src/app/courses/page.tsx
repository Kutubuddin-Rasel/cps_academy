import type { Metadata } from "next";
import { getPublicCourses } from "@/features/courses/api";
import { PublicCourseCatalog } from "@/features/courses/public-course-catalog";
import type { PublicCourseSummary } from "@/features/courses/types";
import { requestErrorMessage } from "@/lib/api/error";

export const metadata: Metadata = { title: "Courses", description: "Explore public courses from CPS Academy." };

export default async function CoursesPage() {
  let courses: PublicCourseSummary[] = [];
  let errorMessage: string | null = null;
  try {
    courses = await getPublicCourses(new AbortController().signal);
  } catch (error: unknown) {
    errorMessage = requestErrorMessage(error);
  }
  return <PublicCourseCatalog courses={courses} errorMessage={errorMessage} />;
}
