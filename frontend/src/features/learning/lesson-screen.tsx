"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { completeLesson, getCourseLessons, getLesson } from "./api";
import { findAvailableLesson } from "./presentation";
import { ProgressSummary } from "./progress-summary";
import type { CourseLesson, CourseProgress, Lesson } from "./types";

export function LessonScreen({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseLessons, setCourseLessons] = useState<CourseLesson[] | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [reload, setReload] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<ApiError | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const completionRequest = useRef<AbortController | null>(null);
  const courseHref = `/learn/${encodeURIComponent(courseId)}`;

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void getLesson(lessonId, token, controller.signal).then((value) => {
      if (!controller.signal.aborted) { setLesson(value); setLoadError(null); }
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else setLoadError(error instanceof ApiError ? error : new ApiError(0, requestErrorMessage(error)));
    });
    void getCourseLessons(courseId, token, controller.signal).then((values) => {
      if (!controller.signal.aborted) setCourseLessons(values);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else setCourseLessons(null);
    });
    return () => { controller.abort(); completionRequest.current?.abort(); };
  }, [courseId, lessonId, token, logout, reload]);

  async function markComplete() {
    if (!token || !lesson || lesson.completed || completionRequest.current) return;
    const controller = new AbortController();
    completionRequest.current = controller;
    setCompleting(true);
    setCompletionError(null);
    try {
      const updatedProgress = await completeLesson(lesson.documentId, token, controller.signal);
      if (controller.signal.aborted) return;
      setLesson((current) => current ? { ...current, completed: true } : current);
      setProgress(updatedProgress);
      try {
        const refreshedLessons = await getCourseLessons(courseId, token, controller.signal);
        if (!controller.signal.aborted) setCourseLessons(refreshedLessons);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) logout();
        else setCourseLessons(null);
      }
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else setCompletionError(error instanceof ApiError ? error : new ApiError(0, requestErrorMessage(error)));
    } finally {
      if (completionRequest.current === controller) {
        completionRequest.current = null;
        setCompleting(false);
      }
    }
  }

  const nextLesson = lesson?.completed && courseLessons ? findAvailableLesson(courseLessons, lessonId) : null;

  let videoHref: string | null = null;
  if (lesson?.videoUrl) {
    try {
      const url = new URL(lesson.videoUrl);
      if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) videoHref = url.href;
    } catch {
      // Invalid external URLs are not rendered as links.
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 [overflow-wrap:anywhere]">
      <Link href={courseHref} className="text-link inline-flex min-h-11 items-center">← Back to course overview</Link>
      {loadError ? (
        <section className="rounded-xl border border-red-200 bg-white p-6">
          <h1 className="text-2xl font-semibold">
            {loadError.status === 409 ? "Lesson locked" : loadError.status === 403 ? "Lesson access denied" : loadError.status === 404 ? "Lesson not found" : "Lesson unavailable"}
          </h1>
          {loadError.status === 409 ? <p className="mt-3 text-slate-600">Complete earlier lessons in the course before opening this lesson.</p> : null}
          <p role="alert" className="mt-3 text-red-800">{loadError.message}</p>
          <button type="button" className="button-secondary mt-4" onClick={() => { setLoadError(null); setLesson(null); setReload((value) => value + 1); }}>Try again</button>
        </section>
      ) : !lesson ? (
        <><h1 className="text-3xl font-semibold">Lesson</h1><p role="status">Loading lesson…</p></>
      ) : (
        <>
          <div>
            <p className="font-mono text-sm tabular-nums text-blue-700">Lesson {String(lesson.order).padStart(2, "0")}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-slate-950">{lesson.title}</h1>
            {lesson.completed ? <p className="mt-3 text-sm font-medium text-emerald-800">Completed</p> : null}
          </div>
          <section aria-label="Lesson content" className="space-y-7 border-y border-slate-200 py-8">
            <p className="whitespace-pre-wrap text-lg leading-9 text-slate-700">{lesson.content || "No written content has been added to this lesson."}</p>
            {videoHref ? (
              <a href={videoHref} target="_blank" rel="noopener noreferrer" className="text-link inline-flex min-h-11 items-center">Open lesson video (opens in a new tab)</a>
            ) : lesson.videoUrl ? <p className="text-sm text-slate-600">A safe video link is not available for this lesson.</p> : null}
          </section>
          <div className="space-y-4">
            {completionError ? <p id="completion-error" role="alert" className="text-red-800">{completionError.status === 409 ? "Complete earlier lessons before marking this lesson complete. " : ""}{completionError.message}</p> : null}
            {!lesson.completed ? <button type="button" className="button-primary" disabled={completing} aria-describedby={completionError ? "completion-error" : undefined} onClick={() => { void markComplete(); }}>
              {completing ? "Saving completion…" : "Mark complete"}
            </button> : null}
            {progress ? <p role="status" className="text-emerald-800">Lesson marked complete. Your progress has been saved.</p> : null}
          </div>
          {progress ? <ProgressSummary {...progress} /> : null}
          {lesson.completed && nextLesson ? (
            <Link href={`/learn/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(nextLesson.documentId)}`} className="button-primary">Continue to {nextLesson.title}</Link>
          ) : <Link href={courseHref} className="button-secondary">Return to Course</Link>}
        </>
      )}
    </div>
  );
}
