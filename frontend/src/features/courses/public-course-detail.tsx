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
  const [ready, setReady] = useState(!student);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) { setEnrolled(false); setReady(true); return; }
    setReady(false);
    const controller = new AbortController();
    void getEnrollments(token, controller.signal).then((values) => {
      if (!controller.signal.aborted) {
        setEnrolled(values.some((item) => item.course.documentId === course.documentId));
        setReady(true);
      }
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else { setMessage({ text: requestErrorMessage(error), error: true }); setReady(true); }
    });
    return () => { controller.abort(); request.current?.abort(); };
  }, [course.documentId, token, logout]);

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
      <Link href="/courses" className="text-link">← Back to courses</Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div>
          <p className="section-kicker">Course overview</p>
          <h1 className="page-heading">{course.title}</h1>
          <p className="mt-4 font-medium text-slate-500">Instructor · {course.instructor?.username ?? "CPS Academy instructor"}</p>
          <section className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight">About this course</h2>
            <p className="mt-4 whitespace-pre-line text-lg leading-8 text-slate-600">{course.description || "Course details are being prepared."}</p>
          </section>
          <section className="mt-12">
            <div className="flex items-end justify-between gap-4"><h2 className="text-2xl font-semibold tracking-tight">Course syllabus</h2><span className="text-sm text-slate-500">{course.syllabus.length} lessons</span></div>
            {course.syllabus.length === 0 ? <p className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">The syllabus is being prepared.</p> : (
              <ol className="learning-path mt-6">
                {course.syllabus.map((lesson) => (
                  <li key={`${lesson.order}-${lesson.title}`} className="learning-path-item">
                    <span className="learning-path-node" aria-hidden="true">{lesson.order}</span>
                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-5 py-4"><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Lesson {lesson.order}</p><h3 className="mt-1 text-lg font-semibold text-slate-950">{lesson.title}</h3></div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
        <aside className="rounded-2xl border border-sky-200 bg-sky-50 p-6 lg:sticky lg:top-6">
          <h2 className="text-xl font-semibold text-slate-950">Start this course</h2>
          <p className="mt-3 leading-7 text-slate-600">Enroll to unlock protected lessons, progress tracking, and quizzes.</p>
          <div className="mt-6 flex flex-col gap-3">
            {auth.status === "unauthenticated" ? (
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
    </article>
  );
}
