import type { Metadata } from "next";
import { CourseOverview } from "@/features/learning/course-overview";

export const metadata: Metadata = { title: "Course learning" };

export default async function CourseLearningPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseOverview key={courseId} courseId={courseId} />;
}
