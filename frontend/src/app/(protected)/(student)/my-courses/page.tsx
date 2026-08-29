import type { Metadata } from "next";
import { MyCourses } from "@/features/courses/my-courses";

export const metadata: Metadata = { title: "My Courses" };

export default function MyCoursesPage() {
  return <MyCourses />;
}
