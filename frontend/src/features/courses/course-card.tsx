import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicCourseSummary } from "./types";

interface CourseCardProps {
  course: PublicCourseSummary;
  actions?: ReactNode;
}

export function CourseCard({ course, actions }: CourseCardProps) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <h2 className="text-2xl [overflow-wrap:anywhere] font-semibold tracking-tight text-slate-950">{course.title}</h2>
      {course.instructor ? (
        <p className="mt-3 text-sm text-slate-600"><span className="font-medium text-slate-700">Instructor</span> · {course.instructor.username}</p>
      ) : null}
      <p className="mt-4 line-clamp-4 whitespace-pre-line text-pretty [overflow-wrap:normal] leading-7 text-slate-600">{course.description || "Course details are being prepared."}</p>
      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        {actions ?? <Link href={`/courses/${encodeURIComponent(course.documentId)}`} className="button-primary">View course</Link>}
      </div>
    </article>
  );
}
