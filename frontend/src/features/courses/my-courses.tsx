"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { getCourseProgress } from "@/features/learning/api";
import { ProgressIndicator } from "@/features/learning/progress-summary";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { getEnrollments } from "./api";
import { buildStudentCourseResumes, groupStudentCourseResumes, studentCourseActionLabel } from "./student-course-resume";
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

  const groups = result.status === "ready" ? groupStudentCourseResumes(result.courses) : null;

  return (
    <div className="space-y-9 [overflow-wrap:anywhere]">
      <header>
        <h1 className="text-4xl font-semibold tracking-[-0.035em] text-slate-950">My Courses</h1>
        <p className="mt-3 text-lg text-slate-600">Pick up where you left off.</p>
      </header>
      {result.status === "loading" ? <p role="status">Loading your courses…</p> : result.status === "error" ? (
        <div className="rounded-xl border border-red-200 bg-white p-6">
          <p role="alert" className="text-red-800">{result.message}</p>
          <button type="button" className="button-secondary mt-4" onClick={() => { setResult({ status: "loading" }); setReload((value) => value + 1); }}>Try again</button>
        </div>
      ) : result.courses.length === 0 ? (
        <p className="border-y border-slate-200 py-6 text-slate-600">You haven’t enrolled in a course yet.</p>
      ) : (
        <div className="space-y-9">
          {groups && groups.inProgress.length > 0 ? (
            <section aria-labelledby="in-progress-courses">
              <h2 id="in-progress-courses" className="text-sm font-semibold tracking-wide text-slate-600">In progress</h2>
              <ul className="mt-4 grid gap-5 lg:grid-cols-2">
                {groups.inProgress.map(({ enrollment: { documentId, course }, progress }) => {
                  if (!progress) return null;
                  return (
                    <li key={documentId}>
                      <article className="flex h-full min-h-64 min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between gap-4 text-sm font-semibold text-blue-800">
                          <span>In progress</span>
                          <span className="font-mono tabular-nums">{progress.percentage}%</span>
                        </div>
                        <h3 className="mt-4 text-2xl font-semibold tracking-[-0.025em] text-slate-950">{course.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{progress.completedLessons} of {progress.totalLessons} {progress.totalLessons === 1 ? "lesson" : "lessons"} completed</p>
                        <div className="mt-6">
                          <ProgressIndicator percentage={progress.percentage} label={`${course.title} progress`} displayLabel="Course progress" />
                        </div>
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                          <Link href={`/learn/${encodeURIComponent(course.documentId)}`} className="button-primary">{studentCourseActionLabel(progress)}</Link>
                          <Link href={`/courses/${encodeURIComponent(course.documentId)}`} className="context-link">Course details</Link>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {groups && groups.notStarted.length > 0 ? (
            <CourseResumeRows title="Not started" courses={groups.notStarted} tone="not-started" />
          ) : null}
          {groups && groups.completed.length > 0 ? (
            <CourseResumeRows title="Completed" courses={groups.completed} tone="completed" showDetails />
          ) : null}
          {groups && groups.unavailable.length > 0 ? (
            <CourseResumeRows title="Progress unavailable" courses={groups.unavailable} tone="unavailable" showDetails />
          ) : null}
        </div>
      )}
    </div>
  );
}

function CourseResumeRows({
  title,
  courses,
  tone,
  showDetails = false,
}: {
  title: string;
  courses: StudentCourseResume[];
  tone: "not-started" | "completed" | "unavailable";
  showDetails?: boolean;
}) {
  const headingId = `${tone}-courses`;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-sm font-semibold tracking-wide text-slate-600">{title}</h2>
      <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
        {courses.map(({ enrollment: { documentId, course }, progress }) => (
          <li key={documentId} className="grid min-w-0 gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">{course.title}</h3>
              <p className={`mt-1 text-sm ${tone === "completed" ? "text-emerald-800" : "text-slate-600"}`}>
                {tone === "not-started" ? "Enrolled · 0% complete"
                  : tone === "completed" && progress ? `Completed · ${progress.completedLessons} of ${progress.totalLessons} ${progress.totalLessons === 1 ? "lesson" : "lessons"}`
                    : "Progress could not be loaded"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <Link href={`/learn/${encodeURIComponent(course.documentId)}`} className={`context-link ${tone === "completed" ? "text-emerald-800 hover:text-emerald-950" : "text-blue-700 hover:text-blue-900"}`}>
                {studentCourseActionLabel(progress)} <span aria-hidden="true">→</span>
              </Link>
              {showDetails ? <Link href={`/courses/${encodeURIComponent(course.documentId)}`} className="context-link">Course details</Link> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
