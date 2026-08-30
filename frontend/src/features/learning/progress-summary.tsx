import type { CourseProgress } from "./types";
import { progressPresentation } from "./presentation";

export function ProgressIndicator({
  percentage,
  label = "Course progress",
  displayLabel,
  showLabelRow = true,
  trackClassName = "bg-slate-200",
}: {
  percentage: number;
  label?: string;
  displayLabel?: string;
  showLabelRow?: boolean;
  trackClassName?: string;
}) {
  const presentation = progressPresentation(percentage);

  return (
    <div>
      {showLabelRow ? <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className={`font-medium ${presentation.textClassName}`}>{displayLabel ?? presentation.label}</span>
        <span className={`font-mono tabular-nums ${presentation.textClassName}`}>{percentage}%</span>
      </div> : null}
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} className={`${showLabelRow ? "mt-2" : ""} h-2 w-full overflow-hidden rounded-full ${trackClassName}`}>
        <div aria-hidden="true" className={`h-full ${presentation.barClassName}`} style={{ width: `${Math.max(0, Math.min(percentage, 100))}%` }} />
      </div>
    </div>
  );
}

export function ProgressSummary({ completedLessons, totalLessons, percentage }: CourseProgress) {
  const presentation = progressPresentation(percentage);
  const statusClassName = presentation.tone === "complete"
    ? "bg-emerald-50 text-emerald-800"
    : presentation.tone === "partial"
      ? "bg-blue-50 text-blue-800"
      : "bg-slate-100 text-slate-700";

  return (
    <section aria-labelledby="course-progress" className="max-w-[52rem] rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id="course-progress" className="text-lg font-semibold text-slate-950">Course progress</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName}`}>{presentation.label}</span>
        <span className={`font-mono text-sm tabular-nums ${presentation.textClassName}`}>{percentage}%</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{completedLessons} of {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"} completed</p>
      <div className="mt-4"><ProgressIndicator percentage={percentage} showLabelRow={false} trackClassName="bg-slate-300" /></div>
    </section>
  );
}
