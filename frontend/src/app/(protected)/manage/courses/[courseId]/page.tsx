import type { Metadata } from "next";
import { CourseManagement } from "@/features/course-management/course-management";

export const metadata: Metadata = { title: "Manage course" };

export default async function ManageCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <CourseManagement key={courseId} courseId={courseId} />;
}
