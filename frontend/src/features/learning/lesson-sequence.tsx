import Link from "next/link";
import { lessonPresentationState } from "./presentation";
import type { LessonPresentationState } from "./presentation";
import type { CourseLesson } from "./types";

function LessonStatusIcon({ state }: { state: LessonPresentationState }) {
  if (state === "completed") {
    return (
      <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 4 4L19 6" />
        </svg>
      </span>
    );
  }

  if (state === "current") {
    return (
      <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-teal)] text-white">
        <span className="h-2.5 w-2.5 rounded-full bg-white" />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    </span>
  );
}

export function LessonSequence({
  courseId,
  lessons,
  completedLessons,
  totalLessons,
}: {
  courseId: string;
  lessons: CourseLesson[];
  completedLessons: number;
  totalLessons: number;
}) {
  return (
    <section aria-labelledby="course-lessons" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-6">
        <div>
          <h2 id="course-lessons" className="text-xl font-semibold tracking-tight text-slate-950">Course content</h2>
          <p className="mt-1 text-sm text-slate-600">Follow the lesson sequence in order.</p>
        </div>
        <p className="font-mono text-sm font-semibold tabular-nums text-[var(--brand-teal-dark)]">
          {completedLessons}/{totalLessons} completed
        </p>
      </div>
      {lessons.length === 0 ? <p className="px-5 py-6 text-slate-600 sm:px-6">No lessons are available in this course yet.</p> : (
        <ol className="divide-y divide-slate-200">
          {lessons.map((lesson) => {
            const state = lessonPresentationState(lesson);
            const presentation = state === "completed"
              ? { label: "Completed", statusClassName: "text-emerald-800", action: "Review" }
              : state === "current"
                ? { label: "Current lesson", statusClassName: "text-[var(--brand-teal-dark)]", action: "Continue" }
                : { label: "Locked", statusClassName: "text-slate-600", action: null };
            const rowClassName = state === "current"
              ? "bg-[var(--brand-teal-soft)]"
              : state === "locked"
                ? "bg-slate-50/70"
                : "bg-white";

            return (
              <li key={lesson.documentId} className={`grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 px-5 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-6 ${rowClassName}`}>
                <LessonStatusIcon state={state} />
                <div className="min-w-0">
                  <p className={`font-mono text-xs font-medium uppercase tracking-[0.08em] tabular-nums ${state === "locked" ? "text-slate-500" : "text-slate-600"}`}>Lesson {String(lesson.order).padStart(2, "0")}</p>
                  <h3 className={`mt-1 font-semibold ${state === "locked" ? "text-slate-600" : "text-slate-950"}`}>{lesson.title}</h3>
                  <p className={`mt-1 text-sm font-medium ${presentation.statusClassName}`}>{presentation.label}</p>
                </div>
                {presentation.action ? (
                  <Link
                    href={`/learn/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lesson.documentId)}`}
                    className={`${state === "current" ? "button-primary" : "button-secondary"} col-start-2 w-fit sm:col-start-3`}
                  >
                    {presentation.action} <span aria-hidden="true" className="ml-2">→</span>
                  </Link>
                ) : <span className="col-start-2 flex min-h-11 items-center text-sm font-medium text-slate-500 sm:col-start-3">Unavailable</span>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
