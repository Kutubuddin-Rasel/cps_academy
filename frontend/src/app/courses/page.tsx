import type { Metadata } from "next";
import { PublicCourseCatalog } from "@/features/courses/public-course-catalog";

export const metadata: Metadata = { title: "Courses", description: "Explore public courses from CPS Academy." };

export default function CoursesPage() {
  return <PublicCourseCatalog />;
}
