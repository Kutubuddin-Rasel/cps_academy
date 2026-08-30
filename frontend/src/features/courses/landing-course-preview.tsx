import Link from "next/link";
import type { PublicCourseSummary } from "./types";

export function LandingCoursePreview({ course }: { course: PublicCourseSummary }) {
  const href = `/courses/${encodeURIComponent(course.documentId)}`;

  return (
    <article className="flex h-full min-w-0 flex-col border-t border-slate-200 py-6">
      <h3 className="text-xl font-semibold tracking-tight text-slate-950">
        <Link href={href} className="transition-colors hover:text-blue-800 motion-reduce:transition-none">
          {course.title}
        </Link>
      </h3>
      {course.instructor ? (
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Instructor</span> · {course.instructor.username}
        </p>
      ) : null}
      <p className="mt-4 line-clamp-3 [overflow-wrap:normal] leading-7 text-slate-600">
        {course.description || "Course details are being prepared."}
      </p>
      <Link href={href} className="mt-auto inline-flex min-h-11 items-center pt-4 text-sm font-semibold text-blue-700 hover:text-blue-900">
        View course <span aria-hidden="true" className="ml-1">→</span>
      </Link>
    </article>
  );
}
