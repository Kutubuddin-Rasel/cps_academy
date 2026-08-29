import type { Metadata } from "next";
import Link from "next/link";
import { CourseForm } from "@/features/course-management/course-form";

export const metadata: Metadata = { title: "Create course" };

export default function CreateCoursePage() {
  return (
    <div className="space-y-8 [overflow-wrap:anywhere]">
      <Link href="/manage/courses" className="text-link">Back to Manage Courses</Link>
      <h1 className="text-3xl font-semibold tracking-tight">Create course</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><CourseForm /></div>
    </div>
  );
}
