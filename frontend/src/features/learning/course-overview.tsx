"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { getCourse } from "@/features/courses/api";
import type { CourseSummary } from "@/features/courses/types";
import { getCourseQuizzes } from "@/features/quizzes/api";
import type { QuizSummary } from "@/features/quizzes/types";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { getCourseLessons, getCourseProgress } from "./api";
import { LessonSequence } from "./lesson-sequence";
import { ProgressSummary } from "./progress-summary";
import type { CourseLesson, CourseProgress } from "./types";

type OverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; course: CourseSummary; lessons: CourseLesson[]; progress: CourseProgress; quizzes: QuizSummary[] };

export function CourseOverview({ courseId }: { courseId: string }) {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const [result, setResult] = useState<OverviewState>({ status: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void Promise.all([
      getCourse(courseId, token, controller.signal),
      getCourseLessons(courseId, token, controller.signal),
      getCourseProgress(courseId, token, controller.signal),
      getCourseQuizzes(courseId, token, controller.signal),
    ]).then(([course, lessons, progress, quizzes]) => {
      if (!controller.signal.aborted) setResult({ status: "ready", course, lessons, progress, quizzes });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else setResult({ status: "error", message: requestErrorMessage(error) });
    });
    return () => controller.abort();
  }, [courseId, token, logout, reload]);

  return (
    <div className="space-y-8 [overflow-wrap:anywhere]">
      <Link href="/my-courses" className="text-link">Back to My Courses</Link>
      {result.status === "loading" ? <><h1 className="text-3xl font-semibold">Course learning</h1><p role="status">Loading your course…</p></> : result.status === "error" ? (
        <section className="rounded-xl border border-red-200 bg-white p-6">
          <h1 className="text-2xl font-semibold">Course unavailable</h1>
          <p role="alert" className="mt-3 text-red-800">{result.message}</p>
          <p className="mt-3 text-slate-600">You must be enrolled in this course to access its lessons and quizzes.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="button-secondary" onClick={() => { setResult({ status: "loading" }); setReload((value) => value + 1); }}>Try again</button>
            <Link href="/courses" className="button-secondary">Browse courses</Link>
          </div>
        </section>
      ) : (
        <>
          <div><h1 className="text-3xl font-semibold tracking-tight">{result.course.title}</h1>{result.course.description ? <p className="mt-3 max-w-3xl whitespace-pre-line leading-7 text-slate-600">{result.course.description}</p> : null}</div>
          <ProgressSummary {...result.progress} />
          <LessonSequence courseId={courseId} lessons={result.lessons} />
          <section aria-labelledby="course-quizzes" className="space-y-4">
            <h2 id="course-quizzes" className="text-xl font-semibold">Quizzes</h2>
            {result.quizzes.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-6">No quizzes are available in this course yet.</p> : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {result.quizzes.map((quiz) => (
                  <li key={quiz.documentId} className="min-w-0 rounded-xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-semibold">{quiz.title}</h3>
                    <Link href={`/learn/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(quiz.documentId)}`} className="button-secondary mt-4">Open quiz</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
