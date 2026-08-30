"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { getCourseProgress } from "@/features/learning/api";
import { ProgressIndicator } from "@/features/learning/progress-summary";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { getEnrollments } from "./api";
import { buildStudentCourseResumes } from "./student-course-resume";
import type { StudentCourseResume } from "./student-course-resume";

type EnrollmentsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; courses: StudentCourseResume[] };

export function MyCourses() {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const [result, setResult] = useState<EnrollmentsState>({ status: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void getEnrollments(token, controller.signal).then(async (enrollments) => {
      const progressResults = await Promise.allSettled(enrollments.map(({ course }) => (
        getCourseProgress(course.documentId, token, controller.signal)
      )));
      if (controller.signal.aborted) return;
      if (progressResults.some((item) => item.status === "rejected" && item.reason instanceof ApiError && item.reason.status === 401)) {
        logout();
        return;
      }
      setResult({ status: "ready", courses: buildStudentCourseResumes(enrollments, progressResults) });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else setResult({ status: "error", message: requestErrorMessage(error) });
    });
    return () => controller.abort();
  }, [token, logout, reload]);

  return (
    <div className="space-y-8 [overflow-wrap:anywhere]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-semibold tracking-tight">My Courses</h1><p className="mt-3 text-slate-600">Continue your lessons and keep track of your progress.</p></div>
        <Link href="/courses" className="button-secondary">Browse courses</Link>
      </div>
      {result.status === "loading" ? <p role="status">Loading your courses…</p> : result.status === "error" ? (
        <div className="rounded-xl border border-red-200 bg-white p-6">
          <p role="alert" className="text-red-800">{result.message}</p>
          <button type="button" className="button-secondary mt-4" onClick={() => { setResult({ status: "loading" }); setReload((value) => value + 1); }}>Try again</button>
        </div>
      ) : result.courses.length === 0 ? (
        <div className="border-l-2 border-slate-300 pl-5"><p>You haven’t enrolled in a course yet.</p><Link href="/courses" className="text-link mt-3 inline-flex min-h-11 items-center">Find your first course</Link></div>
      ) : (
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {result.courses.map(({ enrollment: { documentId, course }, progress }) => (
            <li key={documentId} className="grid min-w-0 gap-5 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,18rem)_auto] sm:items-center sm:gap-8">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">{course.title}</h2>
              <div>
                {progress ? <ProgressIndicator percentage={progress.percentage} label={`${course.title} progress`} /> : <p className="text-sm font-medium text-slate-600">Progress unavailable</p>}
              </div>
              <Link href={`/learn/${encodeURIComponent(course.documentId)}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 hover:text-blue-900">Continue learning <span aria-hidden="true" className="ml-1">→</span></Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
