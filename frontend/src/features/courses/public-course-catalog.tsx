"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { enrollInCourse, getEnrollments, getPublicCourses } from "./api";
import { CourseCard } from "./course-card";
import type { EnrollmentSummary, PublicCourseSummary } from "./types";

type CatalogState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; courses: PublicCourseSummary[] };

export function PublicCourseCatalog() {
  const { state: auth, logout } = useAuth();
  const student = auth.status === "authenticated" && auth.user.role === "Student";
  const token = student ? auth.token : null;
  const [catalog, setCatalog] = useState<CatalogState>({ status: "loading" });
  const [enrollments, setEnrollments] = useState<EnrollmentSummary[]>([]);
  const [enrollmentsReady, setEnrollmentsReady] = useState(false);
  const [reload, setReload] = useState(0);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ courseId: string; message: string; error: boolean } | null>(null);
  const enrollmentRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getPublicCourses(controller.signal).then((courses) => {
      if (!controller.signal.aborted) setCatalog({ status: "ready", courses });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setCatalog({ status: "error", message: requestErrorMessage(error) });
    });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    setEnrollmentsReady(false);
    if (!token) {
      setEnrollments([]);
      setEnrollmentsReady(true);
      return;
    }
    const controller = new AbortController();
    void getEnrollments(token, controller.signal).then((values) => {
      if (!controller.signal.aborted) { setEnrollments(values); setEnrollmentsReady(true); }
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else { setFeedback({ courseId: "", message: requestErrorMessage(error), error: true }); setEnrollmentsReady(true); }
    });
    return () => { controller.abort(); enrollmentRequest.current?.abort(); };
  }, [token, logout]);

  async function enroll(courseId: string) {
    if (!token || enrollmentRequest.current) return;
    const controller = new AbortController();
    enrollmentRequest.current = controller;
    setEnrolling(courseId);
    setFeedback(null);
    try {
      const enrollment = await enrollInCourse(courseId, token, controller.signal);
      if (controller.signal.aborted) return;
      setEnrollments((current) => [...current.filter((item) => item.course.documentId !== courseId), enrollment]);
      setFeedback({ courseId, message: "You’re enrolled. Your course is ready.", error: false });
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else setFeedback({ courseId, message: requestErrorMessage(error), error: true });
    } finally {
      if (!controller.signal.aborted) setEnrolling(null);
      if (enrollmentRequest.current === controller) enrollmentRequest.current = null;
    }
  }

  return (
    <div className="space-y-10 [overflow-wrap:anywhere]">
      <header className="max-w-3xl">
        <p className="section-kicker">Course catalog</p>
        <h1 className="page-heading">Find your next learning path.</h1>
        <p className="page-intro">Explore every CPS Academy course before signing in. Course learning materials remain available only after enrollment.</p>
      </header>
      {feedback?.courseId === "" ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{feedback.message}</p> : null}
      {catalog.status === "loading" ? <p role="status">Loading courses…</p> : catalog.status === "error" ? (
        <div className="rounded-2xl border border-red-200 bg-white p-6">
          <p role="alert" className="text-red-800">{catalog.message}</p>
          <button type="button" className="button-secondary mt-4" onClick={() => { setCatalog({ status: "loading" }); setReload((value) => value + 1); }}>Try again</button>
        </div>
      ) : catalog.courses.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6">No courses are available yet. Please check back later.</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {catalog.courses.map((course) => {
            const enrolled = enrollments.some((item) => item.course.documentId === course.documentId);
            let actions = null;
            if (auth.status === "unauthenticated") {
              actions = <Link href={`/login?next=${encodeURIComponent(`/courses/${course.documentId}`)}`} className="button-primary">Sign in to enroll</Link>;
            } else if (student && enrollmentsReady) {
              actions = enrolled
                ? <Link href={`/learn/${encodeURIComponent(course.documentId)}`} className="button-primary">Continue learning</Link>
                : <button type="button" className="button-primary" disabled={enrolling !== null} onClick={() => { void enroll(course.documentId); }}>{enrolling === course.documentId ? "Enrolling…" : "Enroll"}</button>;
            }
            return (
              <li key={course.documentId}>
                <CourseCard course={course} actions={actions} />
                {feedback?.courseId === course.documentId ? <p role={feedback.error ? "alert" : "status"} className={`mt-3 text-sm ${feedback.error ? "text-red-800" : "text-emerald-800"}`}>{feedback.message}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
      {auth.status === "unauthenticated" ? (
        <div className="rounded-2xl bg-slate-950 px-6 py-8 text-white sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div><h2 className="text-2xl font-semibold">Ready to start?</h2><p className="mt-2 text-slate-300">Create a Student account, then enroll in any course.</p></div>
          <Link href="/register" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-50 sm:mt-0">Create account</Link>
        </div>
      ) : null}
    </div>
  );
}
