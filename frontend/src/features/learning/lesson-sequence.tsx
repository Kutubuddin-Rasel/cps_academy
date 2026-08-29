import Link from "next/link";
import type { CourseLesson } from "./types";

export function LessonSequence({ courseId, lessons }: { courseId: string; lessons: CourseLesson[] }) {
  return (
    <section aria-labelledby="course-lessons" className="space-y-4">
      <h2 id="course-lessons" className="text-xl font-semibold">Lessons</h2>
      {lessons.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-6">No lessons are available in this course yet.</p> : (
        <ol className="space-y-3">
          {lessons.map((lesson) => (
            <li key={lesson.documentId} className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
              <div className="min-w-0 flex-1 basis-48">
                <h3 className="font-semibold">{lesson.order}. {lesson.title}</h3>
                <p className={`mt-1 text-sm ${lesson.locked ? "text-slate-600" : lesson.completed ? "text-emerald-800" : "text-blue-800"}`}>
                  {lesson.locked ? "Locked · Complete earlier lessons to continue" : lesson.completed ? "Completed" : "Available"}
                </p>
              </div>
              {lesson.locked ? null : <Link href={`/learn/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lesson.documentId)}`} className="button-secondary">{lesson.completed ? "Review lesson" : "Open lesson"}</Link>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
