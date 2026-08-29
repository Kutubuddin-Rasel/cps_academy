"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { getEnrollments } from "./api";
import type { EnrollmentSummary } from "./types";

type EnrollmentsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; enrollments: EnrollmentSummary[] };

export function MyCourses() {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const [result, setResult] = useState<EnrollmentsState>({ status: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void getEnrollments(token, controller.signal).then((enrollments) => {
      if (!controller.signal.aborted) setResult({ status: "ready", enrollments });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else setResult({ status: "error", message: requestErrorMessage(error) });
    });
    return () => controller.abort();
  }, [token, logout, reload]);

  return (
    <div className="space-y-8 [overflow-wrap:anywhere]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-semibold tracking-tight">My Courses</h1><p className="mt-3 text-slate-600">Continue your lessons and keep track of your progress.</p></div>
        <Link href="/courses" className="button-secondary">Browse courses</Link>
      </div>
      {result.status === "loading" ? <p role="status">Loading your courses…</p> : result.status === "error" ? (
        <div className="rounded-xl border border-red-200 bg-white p-6">
          <p role="alert" className="text-red-800">{result.message}</p>
          <button type="button" className="button-secondary mt-4" onClick={() => { setResult({ status: "loading" }); setReload((value) => value + 1); }}>Try again</button>
        </div>
      ) : result.enrollments.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6"><p>You haven’t enrolled in a course yet.</p><Link href="/courses" className="text-link mt-4 inline-block">Find your first course</Link></div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.enrollments.map(({ documentId, course }) => (
            <li key={documentId} className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">{course.title}</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{course.description || "No description provided."}</p>
              <div className="mt-auto pt-6"><Link href={`/learn/${encodeURIComponent(course.documentId)}`} className="button-primary">Continue learning</Link></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
