import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicCourseSummary } from "./types";

interface CourseCardProps {
  course: PublicCourseSummary;
  actions?: ReactNode;
}

export function CourseCard({ course, actions }: CourseCardProps) {
  const instructorInitial = course.instructor?.username.trim().charAt(0).toUpperCase();

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-[var(--brand-surface)] shadow-[0_1px_2px_rgba(25,55,64,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-brass-soft)] hover:shadow-[0_16px_35px_rgba(25,55,64,0.09)] motion-reduce:transform-none motion-reduce:transition-none">
      <div aria-hidden="true" className="h-1 w-full bg-[var(--brand-teal)]" />
      <div className="flex flex-1 flex-col p-5 sm:p-7">
        <div className="flex-1">
          <h3 className="text-xl font-semibold leading-tight tracking-[-0.025em] text-slate-950 [overflow-wrap:anywhere] sm:text-2xl">{course.title}</h3>
          <p className="mt-4 line-clamp-4 whitespace-pre-line text-pretty leading-7 text-slate-600 [overflow-wrap:anywhere]">
            {course.description || "No description is available yet."}
          </p>
        </div>
        <div className="mt-7 flex flex-col gap-5 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          {course.instructor ? (
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-teal-soft)] text-sm font-semibold text-[var(--brand-teal-dark)]">
                {instructorInitial}
              </span>
              <p className="min-w-0">
                <span className="block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Instructor</span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">{course.instructor.username}</span>
              </p>
            </div>
          ) : null}
          <div className="flex shrink-0 flex-wrap items-center gap-3 sm:ml-auto">
            {actions ?? <Link href={`/courses/${encodeURIComponent(course.documentId)}`} className="button-primary">View course</Link>}
          </div>
        </div>
      </div>
    </article>
  );
}
