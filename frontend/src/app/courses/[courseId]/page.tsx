import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCourse } from "@/features/courses/api";
import { PublicCourseDetailView } from "@/features/courses/public-course-detail";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import type { PublicCourseDetail } from "@/features/courses/types";

export const metadata: Metadata = { title: "Course details" };

export default async function PublicCoursePage({ params }: PageProps<"/courses/[courseId]">) {
  const { courseId } = await params;
  let course: PublicCourseDetail | null = null;
  let errorMessage: string | null = null;
  try {
    course = await getPublicCourse(courseId, new AbortController().signal);
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 404) notFound();
    errorMessage = requestErrorMessage(error);
  }
  if (errorMessage) return <section className="border-l-2 border-red-700 bg-red-50 px-5 py-4"><h1 className="text-2xl font-semibold">Course unavailable</h1><p role="alert" className="mt-3 text-red-800">{errorMessage}</p></section>;
  if (!course) notFound();
  return <PublicCourseDetailView course={course} />;
}
