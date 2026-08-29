"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { getCourseStudentProgress } from "./api";
import type { CourseStudentProgress } from "./types";

export function StudentProgressSection({ courseId }: { courseId: string }) {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const [data, setData] = useState<CourseStudentProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void getCourseStudentProgress(courseId, token, controller.signal)
      .then((progress) => {
        if (!controller.signal.aborted) {
          setData(progress);
          setError(null);
        }
      }).catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        if (failure instanceof ApiError && failure.status === 401) logout();
        else setError(requestErrorMessage(failure));
      });
    return () => controller.abort();
  }, [courseId, token, logout, reload]);

  return (
    <section aria-labelledby="student-progress-heading" className="min-w-0 space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="student-progress-heading" className="text-xl font-semibold">Student progress</h2>
        <button type="button" className="button-secondary" disabled={data === null && error === null}
          onClick={() => {
            setData(null);
            setError(null);
            setReload((value) => value + 1);
          }}>{error ? "Retry progress" : "Refresh progress"}</button>
      </div>
      {error ? (
        <p role="alert" className="text-red-800">{error}</p>
      ) : data === null ? (
        <p role="status" className="text-slate-600">Loading student progress…</p>
      ) : data.students.length === 0 ? (
        <p className="text-slate-600">No enrolled students yet.</p>
      ) : (
        <ul className="space-y-3">
          {data.students.map(({ student, completedLessons, totalLessons, percentage }) => (
            <li key={student.id} className="min-w-0 space-y-3 rounded-lg border border-slate-200 p-4 [overflow-wrap:anywhere]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="min-w-0 font-medium">{student.username}</h3>
                <p className="text-sm text-slate-600">{completedLessons} / {totalLessons} lessons completed · {percentage}%</p>
              </div>
              <progress aria-label={`Progress for ${student.username}`} value={percentage} max={100}
                className="block h-2 w-full accent-blue-700" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
