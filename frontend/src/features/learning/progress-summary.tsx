import type { CourseProgress } from "./types";
import { progressPresentation } from "./presentation";

export function ProgressIndicator({ percentage, label = "Course progress" }: { percentage: number; label?: string }) {
  const presentation = progressPresentation(percentage);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className={`font-medium ${presentation.textClassName}`}>{presentation.label}</span>
        <span className={`font-mono tabular-nums ${presentation.textClassName}`}>{percentage}%</span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div aria-hidden="true" className={`h-full ${presentation.barClassName}`} style={{ width: `${Math.max(0, Math.min(percentage, 100))}%` }} />
      </div>
    </div>
  );
}

export function ProgressSummary({ completedLessons, totalLessons, percentage }: CourseProgress) {
  return (
    <section aria-labelledby="course-progress" className="border-y border-slate-200 bg-white py-6">
      <h2 id="course-progress" className="text-lg font-semibold">Course progress</h2>
      <div className="mt-4"><ProgressIndicator percentage={percentage} /></div>
      <p className="mt-2 text-sm text-slate-600">{completedLessons} of {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"} completed</p>
    </section>
  );
}
