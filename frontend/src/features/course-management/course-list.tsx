"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { deleteCourse, getManagedCourses } from "./api";
import type { ManagedCourse } from "./types";

export function StaffCourseList() {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const role = auth.status === "authenticated" ? auth.user.role : null;
  const [courses, setCourses] = useState<ManagedCourse[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const deletionRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void getManagedCourses(token, controller.signal).then((values) => {
      if (!controller.signal.aborted) { setCourses(values); setLoadError(null); }
    }).catch((failure: unknown) => {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) logout();
      else setLoadError(requestErrorMessage(failure));
    });
    return () => { controller.abort(); deletionRequest.current?.abort(); };
  }, [token, logout, reload]);

  async function removeCourse(course: ManagedCourse) {
    if (!token || deletionRequest.current || !window.confirm(`Delete course “${course.title}”? This cannot be undone.`)) return;
    const controller = new AbortController();
    deletionRequest.current = controller;
    setDeleting(course.documentId);
    setActionError(null);
    setNotice(null);
    try {
      await deleteCourse(course.documentId, token, controller.signal);
      if (controller.signal.aborted) return;
      setNotice("Course deleted.");
      setCourses(null);
      setLoadError(null);
      setReload((value) => value + 1);
    } catch (failure: unknown) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) logout();
      else setActionError(requestErrorMessage(failure));
    } finally {
      if (deletionRequest.current === controller) { deletionRequest.current = null; setDeleting(null); }
    }
  }

  return (
    <div className="space-y-8 [overflow-wrap:anywhere]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-semibold tracking-tight">Manage Courses</h1><p className="mt-3 text-slate-600">{role === "Instructor" ? "Create and manage your own courses, lessons, and quizzes." : "Manage courses, lessons, and quizzes across CPS Academy."}</p></div>
        <Link href="/manage/courses/new" className="button-primary">Create course</Link>
      </div>
      {actionError ? <p role="alert" className="text-red-800">{actionError}</p> : null}
      {notice ? <p role="status" className="text-emerald-800">{notice}</p> : null}
      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-white p-6"><p role="alert" className="text-red-800">{loadError}</p><button type="button" className="button-secondary mt-4" onClick={() => { setLoadError(null); setCourses(null); setReload((value) => value + 1); }}>Try again</button></div>
      ) : courses === null ? <p role="status">Loading courses…</p> : courses.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6"><p>No courses to manage yet.</p><Link href="/manage/courses/new" className="text-link mt-4 inline-block">Create your first course</Link></div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <li key={course.documentId} className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">{course.title}</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{course.description || "No description provided."}</p>
              <div className="mt-auto flex flex-wrap gap-3 pt-6">
                <Link href={`/manage/courses/${encodeURIComponent(course.documentId)}`} className="button-secondary">Manage course</Link>
                <button type="button" className="button-secondary text-red-800" disabled={deleting !== null} onClick={() => { void removeCourse(course); }}>{deleting === course.documentId ? "Deleting…" : "Delete course"}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
