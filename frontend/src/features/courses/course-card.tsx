import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicCourseSummary } from "./types";

interface CourseCardProps {
  course: PublicCourseSummary;
  actions?: ReactNode;
  compact?: boolean;
}

export function CourseCard({ course, actions, compact = false }: CourseCardProps) {
  return (
    <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Course</p>
      <h2 className={`${compact ? "text-xl" : "text-2xl"} mt-3 font-semibold tracking-tight text-slate-950`}>{course.title}</h2>
      <p className="mt-3 text-sm font-medium text-slate-500">Led by {course.instructor?.username ?? "CPS Academy instructor"}</p>
      <p className="mt-4 line-clamp-4 whitespace-pre-line leading-7 text-slate-600">{course.description || "Course details are being prepared."}</p>
      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Link href={`/courses/${encodeURIComponent(course.documentId)}`} className={actions ? "button-secondary" : "button-primary"}>View course</Link>
        {actions}
      </div>
    </article>
  );
}
