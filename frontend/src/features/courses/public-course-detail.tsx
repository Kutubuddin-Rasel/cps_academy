"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { enrollInCourse, getEnrollments } from "./api";
import type { PublicCourseDetail } from "./types";

export function PublicCourseDetailView({ course }: { course: PublicCourseDetail }) {
  const { state: auth, logout } = useAuth();
  const student = auth.status === "authenticated" && auth.user.role === "Student";
  const token = student ? auth.token : null;
  const [enrolled, setEnrolled] = useState(false);
  const [loadedToken, setLoadedToken] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void getEnrollments(token, controller.signal).then((values) => {
      if (!controller.signal.aborted) {
        setEnrolled(values.some((item) => item.course.documentId === course.documentId));
        setLoadedToken(token);
      }
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else { setMessage({ text: requestErrorMessage(error), error: true }); setLoadedToken(token); }
    });
    return () => { controller.abort(); request.current?.abort(); };
  }, [course.documentId, token, logout]);

  const ready = !student || loadedToken === token;

  async function enroll() {
    if (!token || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setEnrolling(true);
    setMessage(null);
    try {
      await enrollInCourse(course.documentId, token, controller.signal);
      if (!controller.signal.aborted) { setEnrolled(true); setMessage({ text: "You’re enrolled. The learning path is ready.", error: false }); }
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        if (error instanceof ApiError && error.status === 401) logout();
        else setMessage({ text: requestErrorMessage(error), error: true });
      }
    } finally {
      if (!controller.signal.aborted) setEnrolling(false);
      if (request.current === controller) request.current = null;
    }
  }

  return (
    <article className="[overflow-wrap:anywhere]">
      <Link href="/courses" className="text-link inline-flex min-h-11 items-center">← Back to Courses</Link>
      <header className="mt-5 max-w-4xl">
        <h1 className="page-heading mt-0">{course.title}</h1>
        <p className="mt-6 max-w-3xl whitespace-pre-line text-lg leading-8 text-slate-600">{course.description || "Course details are being prepared."}</p>
        {course.instructor ? <p className="mt-5 text-sm text-slate-600"><span className="font-medium text-slate-700">Instructor</span> · {course.instructor.username}</p> : null}
      </header>

      <section aria-labelledby="course-structure" className="mt-12">
        <div className="max-w-3xl border-t border-slate-200 pt-6">
          <p className="font-mono text-sm tabular-nums text-blue-700">{course.syllabus.length} {course.syllabus.length === 1 ? "lesson" : "lessons"}</p>
          <h2 id="course-structure" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Course structure</h2>
          <p className="mt-3 leading-7 text-slate-600">Follow this instructor-designed learning path in order after you enroll.</p>
        </div>

        <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-12">
          <div>
            {course.syllabus.length === 0 ? <p className="border-l-2 border-slate-300 pl-5 text-slate-600">The syllabus is being prepared.</p> : (
              <ol className="relative border-y border-slate-200 before:absolute before:bottom-8 before:left-4 before:top-8 before:w-px before:bg-blue-200">
                {course.syllabus.map((lesson) => (
                  <li key={`${lesson.order}-${lesson.title}`} className="relative grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-center gap-4 border-b border-slate-200 py-5 last:border-b-0">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-blue-300 bg-slate-50 font-mono text-xs tabular-nums text-blue-800">{String(lesson.order).padStart(2, "0")}</span>
                    <h3 className="min-w-0 text-lg font-semibold text-slate-950">{lesson.title}</h3>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <aside className="border-y border-slate-200 bg-white py-6 lg:rounded-xl lg:border lg:border-blue-200 lg:bg-blue-50 lg:p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Start this course</h2>
          <p className="mt-3 leading-7 text-slate-600">Enroll to unlock protected lessons, progress tracking, and quizzes.</p>
          <div className="mt-6 flex flex-col gap-3">
            {auth.status === "loading" ? (
              <p role="status" className="text-sm text-slate-600">Checking session…</p>
            ) : auth.status === "unauthenticated" || auth.status === "error" ? (
              <><Link href="/login" className="button-primary">Sign in to enroll</Link><Link href="/register" className="button-secondary">Create account</Link></>
            ) : student && ready ? enrolled ? (
              <Link href={`/learn/${encodeURIComponent(course.documentId)}`} className="button-primary">Continue learning</Link>
            ) : (
              <button type="button" className="button-primary" disabled={enrolling} onClick={() => { void enroll(); }}>{enrolling ? "Enrolling…" : "Enroll"}</button>
            ) : student ? <p role="status" className="text-sm text-slate-600">Checking enrollment…</p> : (
              <p className="text-sm leading-6 text-slate-600">Your staff account can view this public course. Authoring remains under Manage Courses.</p>
            )}
          </div>
          {message ? <p role={message.error ? "alert" : "status"} className={`mt-4 text-sm ${message.error ? "text-red-800" : "text-emerald-800"}`}>{message.text}</p> : null}
          </aside>
        </div>
      </section>
    </article>
  );
}
