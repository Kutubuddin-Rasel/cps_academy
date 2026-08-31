import Link from "next/link";
import type { PublicCourseSummary } from "./types";

export function LandingCoursePreview({ course }: { course: PublicCourseSummary }) {
  const href = `/courses/${encodeURIComponent(course.documentId)}`;

  return (
    <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-stone-200 bg-[var(--brand-surface)] p-6 shadow-[0_1px_2px_rgba(25,55,64,0.04)] transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-[var(--brand-brass-soft)] hover:shadow-[0_14px_32px_rgba(25,55,64,0.09)] motion-reduce:transform-none motion-reduce:transition-none sm:p-7">
      <p className="section-kicker">Course</p>
      <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-2xl">
        <Link href={href} className="rounded-sm transition-colors hover:text-[var(--brand-teal)] motion-reduce:transition-none">
          {course.title}
        </Link>
      </h3>
      {course.instructor ? (
        <p className="mt-3 flex min-w-0 items-center gap-2 text-sm text-slate-600">
          <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-teal-soft)] font-semibold uppercase text-[var(--brand-teal-dark)]">
            {course.instructor.username.slice(0, 1)}
          </span>
          <span className="min-w-0 truncate"><span className="font-medium text-slate-800">Instructor</span> · {course.instructor.username}</span>
        </p>
      ) : null}
      <p className="mt-5 line-clamp-3 [overflow-wrap:anywhere] leading-7 text-slate-600">
        {course.description || "Course details are being prepared."}
      </p>
      <Link href={href} className="mt-auto inline-flex min-h-11 items-center self-start pt-5 text-sm font-semibold text-[var(--brand-teal)] transition-colors hover:text-[var(--brand-ink)] motion-reduce:transition-none">
        View course <span aria-hidden="true" className="ml-1">→</span>
      </Link>
    </article>
  );
}
