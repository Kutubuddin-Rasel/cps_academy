import type { CourseProgress } from "./types";

export function ProgressSummary({ completedLessons, totalLessons, percentage }: CourseProgress) {
  return (
    <section aria-labelledby="course-progress" className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="course-progress" className="text-lg font-semibold">Course progress</h2>
        <p className="font-semibold text-blue-800">{percentage}% complete</p>
      </div>
      <progress aria-label="Course progress" className="mt-4 h-3 w-full accent-blue-700" value={percentage} max={100}>{percentage}%</progress>
      <p className="mt-2 text-sm text-slate-600">{completedLessons} of {totalLessons} lessons completed</p>
    </section>
  );
}
