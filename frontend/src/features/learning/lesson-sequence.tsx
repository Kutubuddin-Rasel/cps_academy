import Link from "next/link";
import { lessonPresentationState } from "./presentation";
import type { CourseLesson } from "./types";

export function LessonSequence({ courseId, lessons }: { courseId: string; lessons: CourseLesson[] }) {
  return (
    <section aria-labelledby="course-lessons">
      <h2 id="course-lessons" className="text-2xl font-semibold tracking-tight text-slate-950">Course content</h2>
      {lessons.length === 0 ? <p className="mt-5 border-l-2 border-slate-300 pl-5 text-slate-600">No lessons are available in this course yet.</p> : (
        <ol className="relative mt-6 border-y border-slate-200 before:absolute before:bottom-8 before:left-4 before:top-8 before:w-px before:bg-slate-200">
          {lessons.map((lesson) => {
            const state = lessonPresentationState(lesson);
            const presentation = state === "completed"
              ? { symbol: "✓", label: "Completed", tone: "border-emerald-300 bg-emerald-50 text-emerald-800", action: "Review" }
              : state === "current"
                ? { symbol: "●", label: "Current lesson", tone: "border-blue-300 bg-blue-50 text-blue-800", action: "Continue" }
                : { symbol: "○", label: "Locked", tone: "border-slate-300 bg-slate-50 text-slate-600", action: null };

            return (
              <li key={lesson.documentId} className="relative grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-4 border-b border-slate-200 py-5 last:border-b-0 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center">
                <span aria-hidden="true" className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border font-mono text-xs ${presentation.tone}`}>{presentation.symbol}</span>
                <div className="min-w-0">
                  <p className="font-mono text-xs tabular-nums text-slate-500">Lesson {String(lesson.order).padStart(2, "0")}</p>
                  <h3 className="mt-1 font-semibold text-slate-950">{lesson.title}</h3>
                  <p className={`mt-1 text-sm ${state === "completed" ? "text-emerald-800" : state === "current" ? "text-blue-800" : "text-slate-600"}`}>{presentation.label}</p>
                </div>
                {presentation.action ? (
                  <Link href={`/learn/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lesson.documentId)}`} className="context-link col-start-2 text-blue-700 hover:text-blue-900 sm:col-start-3">
                    {presentation.action} <span aria-hidden="true">→</span>
                  </Link>
                ) : <span className="col-start-2 flex min-h-11 items-center text-sm text-slate-500 sm:col-start-3">Unavailable</span>}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
