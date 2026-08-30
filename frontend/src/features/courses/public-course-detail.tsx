"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { getCourseProgress } from "@/features/learning/api";
import type { CourseProgress } from "@/features/learning/types";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { enrollInCourse, getEnrollments } from "./api";
import { studentCourseActionLabel } from "./student-course-resume";
import type { PublicCourseDetail } from "./types";

type EnrollmentState =
  | { status: "checking" }
  | { status: "unenrolled" }
  | { status: "enrolled"; progress: CourseProgress | null }
  | { status: "error" };

export function PublicCourseDetailView({ course }: { course: PublicCourseDetail }) {
  const { state: auth, logout } = useAuth();
  const student = auth.status === "authenticated" && auth.user.role === "Student";
  const token = student ? auth.token : null;
  const [enrollment, setEnrollment] = useState<EnrollmentState>({ status: "checking" });
  const [loadedToken, setLoadedToken] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void getEnrollments(token, controller.signal).then(async (values) => {
      const enrolled = values.some((item) => item.course.documentId === course.documentId);
      if (!enrolled) {
        if (!controller.signal.aborted) {
          setEnrollment({ status: "unenrolled" });
          setLoadedToken(token);
        }
        return;
      }
      let progress: CourseProgress | null = null;
      try {
        progress = await getCourseProgress(course.documentId, token, controller.signal);
      } catch (error: unknown) {
        if (error instanceof ApiError && error.status === 401) {
          logout();
          return;
        }
      }
      if (!controller.signal.aborted) {
        setEnrollment({ status: "enrolled", progress });
        setLoadedToken(token);
      }
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else {
        setEnrollment({ status: "error" });
        setMessage({ text: requestErrorMessage(error), error: true });
        setLoadedToken(token);
      }
    });
    return () => { controller.abort(); request.current?.abort(); };
  }, [course.documentId, token, logout]);

  const ready = !student || loadedToken === token;
  const learningAction = enrollment.status === "enrolled"
    ? studentCourseActionLabel(enrollment.progress)
    : null;
  const accessHeading = learningAction === "Review course"
    ? "Review this course"
    : learningAction === "Continue learning"
      ? "Continue learning"
      : learningAction === "Start learning"
        ? "Start learning"
        : learningAction === "Open course"
          ? "Open this course"
          : auth.status === "authenticated" && !student
            ? "Course access"
            : "Start this course";
  const accessDescription = learningAction === "Review course"
    ? "Revisit the completed learning path and assessment whenever you need it."
    : learningAction === "Continue learning"
      ? "Return to the next lesson made available by your protected learning path."
      : learningAction === "Start learning"
        ? "Your protected learning path is ready for its first lesson."
        : learningAction === "Open course"
          ? "Your enrollment is active. Progress is temporarily unavailable."
          : auth.status === "authenticated" && !student
            ? "View the public syllabus here. Course authoring remains under Manage Courses."
            : "Enroll to unlock protected lessons, progress tracking, and quizzes.";

  async function enroll() {
    if (!token || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setEnrolling(true);
    setMessage(null);
    try {
      await enrollInCourse(course.documentId, token, controller.signal);
      if (controller.signal.aborted) return;
      let progress: CourseProgress | null = null;
      try {
        progress = await getCourseProgress(course.documentId, token, controller.signal);
      } catch (error: unknown) {
        if (error instanceof ApiError && error.status === 401) {
          logout();
          return;
        }
      }
      if (!controller.signal.aborted) {
        setEnrollment({ status: "enrolled", progress });
        setLoadedToken(token);
        setMessage({ text: "You’re enrolled. The learning path is ready.", error: false });
      }
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
      <header className="max-w-4xl">
        <h1 className="page-heading mt-0">{course.title}</h1>
        <p className="mt-6 max-w-3xl whitespace-pre-line text-lg leading-8 text-slate-600">{course.description || "Course details are being prepared."}</p>
        {course.instructor ? <p className="mt-5 text-sm text-slate-600"><span className="font-medium text-slate-700">Instructor</span> · {course.instructor.username}</p> : null}
      </header>

      <section aria-labelledby="course-structure" className="mt-12">
        <div className="max-w-3xl border-t border-slate-200 pt-6">
          <p className="font-mono text-sm tabular-nums text-blue-700">{course.syllabus.length} {course.syllabus.length === 1 ? "lesson" : "lessons"}</p>
          <h2 id="course-structure" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Course structure</h2>
          <p className="mt-3 leading-7 text-slate-600">Follow this instructor-designed learning path in order.</p>
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
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{accessHeading}</h2>
          <p className="mt-3 leading-7 text-slate-600">{accessDescription}</p>
          <div className="mt-6 flex flex-col gap-3">
            {auth.status === "loading" ? (
              <p role="status" className="text-sm text-slate-600">Checking session…</p>
            ) : auth.status === "unauthenticated" || auth.status === "error" ? (
              <><Link href="/login" className="button-primary">Sign in to enroll</Link><Link href="/register" className="button-secondary">Create account</Link></>
            ) : student && ready ? enrollment.status === "enrolled" ? (
              <Link href={`/learn/${encodeURIComponent(course.documentId)}`} className="button-primary">{learningAction}</Link>
            ) : enrollment.status === "unenrolled" ? (
              <button type="button" className="button-primary" disabled={enrolling} onClick={() => { void enroll(); }}>{enrolling ? "Enrolling…" : "Enroll"}</button>
            ) : enrollment.status === "error" ? (
              <p className="text-sm leading-6 text-slate-600">Course access could not be checked. Try again after the service is available.</p>
            ) : (
              <p role="status" className="text-sm text-slate-600">Checking enrollment…</p>
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
