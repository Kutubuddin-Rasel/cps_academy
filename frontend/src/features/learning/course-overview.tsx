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
import { findAvailableLesson, progressPresentation } from "./presentation";
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

function OverviewProgress({ progress }: { progress: CourseProgress }) {
  const presentation = progressPresentation(progress.percentage);
  const statusClassName = presentation.tone === "complete"
    ? "bg-emerald-100 text-emerald-800"
    : presentation.tone === "partial"
      ? "bg-[var(--brand-teal-soft)] text-[var(--brand-teal-dark)]"
      : "bg-slate-100 text-slate-700";
  const percentageClassName = presentation.tone === "complete"
    ? "text-emerald-800"
    : presentation.tone === "partial"
      ? "text-[var(--brand-teal-dark)]"
      : "text-slate-600";

  return (
    <section aria-labelledby="overview-progress-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="overview-progress-title" className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Your progress</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName}`}>{presentation.label}</span>
      </div>
      <p className={`mt-5 font-mono text-4xl font-semibold tracking-tight tabular-nums ${percentageClassName}`}>{progress.percentage}%</p>
      <p className="mt-1 text-sm text-slate-600">
        {progress.completedLessons} of {progress.totalLessons} {progress.totalLessons === 1 ? "lesson" : "lessons"} completed
      </p>
      <div role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percentage} className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          aria-hidden="true"
          className={`h-full ${presentation.tone === "complete" ? "bg-emerald-600" : presentation.tone === "partial" ? "bg-[var(--brand-teal)]" : "bg-slate-500"}`}
          style={{ width: `${Math.max(0, Math.min(progress.percentage, 100))}%` }}
        />
      </div>
    </section>
  );
}

function NextLessonPanel({ courseId, lesson, progress }: { courseId: string; lesson: CourseLesson | null; progress: CourseProgress }) {
  if (lesson) {
    const starting = progress.percentage === 0;
    return (
      <section aria-labelledby="next-lesson-title" className="rounded-2xl bg-[var(--brand-teal)] p-5 text-white shadow-lg shadow-[#193740]/15">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d8ece8]">{starting ? "Start here" : "Up next"}</p>
        <p className="mt-5 font-mono text-sm tabular-nums text-[#d8ece8]">Lesson {String(lesson.order).padStart(2, "0")}</p>
        <h2 id="next-lesson-title" className="mt-1 text-xl font-semibold leading-7 tracking-tight">{lesson.title}</h2>
        <Link
          href={`/learn/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lesson.documentId)}`}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--brand-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-teal-dark)] transition-colors hover:bg-[var(--brand-brass-soft)] active:bg-white motion-reduce:transition-none"
        >
          {starting ? "Start lesson" : "Continue lesson"} <span aria-hidden="true" className="ml-2">→</span>
        </Link>
      </section>
    );
  }

  if (progress.percentage >= 100) {
    return (
      <section aria-labelledby="course-complete-title" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 4 4L19 6" />
          </svg>
        </span>
        <h2 id="course-complete-title" className="mt-4 text-xl font-semibold tracking-tight text-emerald-950">Course complete</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900">You can review any lesson in the course content.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="no-lesson-title" className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 id="no-lesson-title" className="text-lg font-semibold text-slate-950">No lesson available</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">There is no incomplete unlocked lesson to continue right now.</p>
    </section>
  );
}

function AssessmentSection({ courseId, assessments }: { courseId: string; assessments: AssessmentView[] }) {
  return (
    <section aria-labelledby="course-quizzes" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <h2 id="course-quizzes" className="text-xl font-semibold tracking-tight text-slate-950">Assessment</h2>
        <p className="mt-1 text-sm text-slate-600">Check your understanding and review your latest results.</p>
      </div>
      {assessments.length === 0 ? (
        <p className="px-5 py-6 text-slate-600 sm:px-6">No quizzes are available in this course yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200">
          {assessments.map(({ quiz, latestAttempt, historyAvailable }) => (
            <li key={quiz.documentId} className="grid min-w-0 gap-5 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
              <div className="flex min-w-0 items-start gap-4">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11h6M9 15h4" />
                    <path d="M15 3H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-950">{quiz.title}</h3>
                  {latestAttempt ? (
                    <p className="mt-1 font-mono text-sm tabular-nums text-slate-600">Latest result: {latestAttempt.score} / {latestAttempt.total} · {latestAttempt.percentage}%</p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-600">{historyAvailable ? "No attempts yet" : "Attempt history unavailable"}</p>
                  )}
                </div>
              </div>
              <Link href={`/learn/${encodeURIComponent(courseId)}/quizzes/${encodeURIComponent(quiz.documentId)}`} className="button-secondary w-fit">
                Open quiz <span aria-hidden="true" className="ml-2">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

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
    <div className="mx-auto max-w-[70rem] [overflow-wrap:anywhere]">
      {result.status === "loading" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Course learning</h1>
          <p role="status" className="mt-3 text-slate-600">Loading your course…</p>
        </section>
      ) : result.status === "error" ? (
        <section className="rounded-2xl border border-red-200 bg-white p-6 sm:p-8">
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-700">!</span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">Course unavailable</h1>
          <p role="alert" className="mt-3 text-red-800">{result.message}</p>
          <p className="mt-3 max-w-xl text-slate-600">You must be enrolled in this course to access its lessons and quizzes.</p>
          <button type="button" className="button-secondary mt-5" onClick={() => { setResult({ status: "loading" }); setReload((value) => value + 1); }}>Try again</button>
        </section>
      ) : (
        <>
          <header className="border-b border-slate-200 pb-8 sm:pb-10">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl sm:leading-[1.08]">{result.course.title}</h1>
            {result.course.description ? <p className="mt-5 max-w-3xl whitespace-pre-line text-lg leading-8 text-slate-600">{result.course.description}</p> : null}
          </header>
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10">
            <aside aria-label="Course progress and next lesson" className="grid gap-5 lg:sticky lg:top-24 lg:order-2">
              <div className="order-1 lg:order-2"><OverviewProgress progress={result.progress} /></div>
              <div className="order-2 lg:order-1"><NextLessonPanel courseId={courseId} lesson={availableLesson} progress={result.progress} /></div>
            </aside>
            <div className="space-y-8 lg:order-1">
              <LessonSequence
                courseId={courseId}
                lessons={result.lessons}
                completedLessons={result.progress.completedLessons}
                totalLessons={result.progress.totalLessons}
              />
              <AssessmentSection courseId={courseId} assessments={result.assessments} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
