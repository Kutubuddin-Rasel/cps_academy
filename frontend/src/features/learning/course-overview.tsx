"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { getCourse } from "@/features/courses/api";
import type { CourseSummary } from "@/features/courses/types";
import { getCourseQuizzes, getQuizAttempts } from "@/features/quizzes/api";
import { newestQuizAttempt } from "@/features/quizzes/presentation";
import type { QuizAttempt, QuizSummary } from "@/features/quizzes/types";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { getCourseLessons, getCourseProgress } from "./api";
import { LessonSequence } from "./lesson-sequence";
import { findAvailableLesson } from "./presentation";
import { ProgressSummary } from "./progress-summary";
import type { CourseLesson, CourseProgress } from "./types";

interface AssessmentView {
  quiz: QuizSummary;
  latestAttempt: QuizAttempt | null;
  historyAvailable: boolean;
}

type OverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; course: CourseSummary; lessons: CourseLesson[]; progress: CourseProgress; assessments: AssessmentView[] };

export function CourseOverview({ courseId }: { courseId: string }) {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const [result, setResult] = useState<OverviewState>({ status: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token) return;
    const sessionToken = token;
    const controller = new AbortController();
    async function loadOverview() {
      try {
        const [course, lessons, progress, quizzes] = await Promise.all([
          getCourse(courseId, sessionToken, controller.signal),
          getCourseLessons(courseId, sessionToken, controller.signal),
          getCourseProgress(courseId, sessionToken, controller.signal),
          getCourseQuizzes(courseId, sessionToken, controller.signal),
        ]);
        const attemptResults = await Promise.allSettled(quizzes.map((quiz) => (
          getQuizAttempts(quiz.documentId, sessionToken, controller.signal)
        )));
        if (controller.signal.aborted) return;
        if (attemptResults.some((item) => item.status === "rejected" && item.reason instanceof ApiError && item.reason.status === 401)) {
          logout();
          return;
        }
        const assessments = quizzes.map((quiz, index): AssessmentView => {
          const attemptResult = attemptResults[index];
          return {
            quiz,
            latestAttempt: attemptResult?.status === "fulfilled" ? newestQuizAttempt(attemptResult.value) : null,
            historyAvailable: attemptResult?.status === "fulfilled",
          };
        });
        setResult({ status: "ready", course, lessons, progress, assessments });
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) logout();
        else setResult({ status: "error", message: requestErrorMessage(error) });
      }
    }
    void loadOverview();
    return () => controller.abort();
  }, [courseId, token, logout, reload]);

  const availableLesson = result.status === "ready" ? findAvailableLesson(result.lessons) : null;

  return (
    <div className="space-y-8 [overflow-wrap:anywhere]">
      <Link href="/my-courses" className="text-link inline-flex min-h-11 items-center">← Back to My Courses</Link>
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
          <header><p className="font-mono text-sm text-blue-700">Course</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-slate-950">{result.course.title}</h1>{result.course.description ? <p className="mt-4 max-w-3xl whitespace-pre-line text-lg leading-8 text-slate-600">{result.course.description}</p> : null}</header>
          <ProgressSummary {...result.progress} />
          {availableLesson ? (
            <div>
              <Link href={`/learn/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(availableLesson.documentId)}`} className="button-primary">Continue learning</Link>
            </div>
          ) : <p className="text-sm text-slate-600">No incomplete unlocked lesson is available.</p>}
          <LessonSequence courseId={courseId} lessons={result.lessons} />
          <section aria-labelledby="course-quizzes">
            <h2 id="course-quizzes" className="text-2xl font-semibold tracking-tight text-slate-950">Assessment</h2>
            {result.assessments.length === 0 ? <p className="mt-5 border-l-2 border-slate-300 pl-5 text-slate-600">No quizzes are available in this course yet.</p> : (
              <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                {result.assessments.map(({ quiz, latestAttempt, historyAvailable }) => (
                  <li key={quiz.documentId} className="grid min-w-0 gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{quiz.title}</h3>
                      {latestAttempt ? (
                        <p className="mt-1 font-mono text-sm tabular-nums text-slate-600">Latest: {latestAttempt.score} / {latestAttempt.total} · {latestAttempt.percentage}%</p>
                      ) : <p className="mt-1 text-sm text-slate-600">{historyAvailable ? "No attempts yet" : "Attempt history unavailable"}</p>}
                    </div>
                    <Link href={`/learn/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(quiz.documentId)}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 hover:text-blue-900">Open quiz <span aria-hidden="true" className="ml-1">→</span></Link>
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
