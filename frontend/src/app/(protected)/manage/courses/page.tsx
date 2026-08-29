import type { Metadata } from "next";
import { StaffCourseList } from "@/features/course-management/course-list";

export const metadata: Metadata = { title: "Manage Courses" };

export default function ManageCoursesPage() {
  return <StaffCourseList />;
}
