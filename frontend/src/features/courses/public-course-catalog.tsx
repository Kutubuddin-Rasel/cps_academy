"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { getCourseProgress } from "@/features/learning/api";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { getEnrollments, getPublicCourses } from "./api";
import { CourseCard } from "./course-card";
import { publicCourseGridClassName } from "./public-course-layout";
import { buildStudentCourseResumes, studentCourseActionLabel } from "./student-course-resume";
import type { StudentCourseResume } from "./student-course-resume";
import type { PublicCourseSummary } from "./types";

type CatalogState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; courses: PublicCourseSummary[] };

export function PublicCourseCatalog() {
  const { state: auth, logout } = useAuth();
  const student = auth.status === "authenticated" && auth.user.role === "Student";
  const token = student ? auth.token : null;
  const [catalog, setCatalog] = useState<CatalogState>({ status: "loading" });
  const [resumes, setResumes] = useState<StudentCourseResume[]>([]);
  const [loadedToken, setLoadedToken] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [feedback, setFeedback] = useState<{ courseId: string; message: string; error: boolean } | null>(null);

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
    if (!token) return;
    const controller = new AbortController();
    void getEnrollments(token, controller.signal).then(async (enrollments) => {
      const progressResults = await Promise.allSettled(enrollments.map(({ course }) => (
        getCourseProgress(course.documentId, token, controller.signal)
      )));
      if (controller.signal.aborted) return;
      if (progressResults.some((item) => item.status === "rejected" && item.reason instanceof ApiError && item.reason.status === 401)) {
        logout();
        return;
      }
      setResumes(buildStudentCourseResumes(enrollments, progressResults));
      setLoadedToken(token);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else {
        setResumes([]);
        setFeedback({ courseId: "", message: requestErrorMessage(error), error: true });
        setLoadedToken(token);
      }
    });
    return () => controller.abort();
  }, [token, logout]);

  const enrollmentsReady = !student || loadedToken === token;
  const resumeByCourseId = new Map(resumes.map((resume) => [resume.enrollment.course.documentId, resume]));

  return (
    <div className="space-y-9">
      <header className="max-w-3xl">
        <p className="section-kicker">Course catalog</p>
        <h1 className="page-heading">Courses</h1>
        <p className="page-intro">Explore CPS Academy courses and review each syllabus before you enroll.</p>
      </header>
      {feedback?.courseId === "" ? <p role="alert" className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-red-800">{feedback.message}</p> : null}
      {catalog.status === "loading" ? <p role="status" className="text-slate-600">Loading courses…</p> : catalog.status === "error" ? (
        <div className="border-l-2 border-red-700 bg-red-50 px-5 py-4">
          <p role="alert" className="text-red-800">{catalog.message}</p>
          <button type="button" className="button-secondary mt-4" onClick={() => { setCatalog({ status: "loading" }); setReload((value) => value + 1); }}>Try again</button>
        </div>
      ) : catalog.courses.length === 0 ? (
        <p className="border-l-2 border-slate-300 pl-5 text-slate-600">No courses are available yet. Please check back later.</p>
      ) : (
        <ul className={publicCourseGridClassName(catalog.courses.length)}>
          {catalog.courses.map((course) => {
            const resume = resumeByCourseId.get(course.documentId);
            const courseHref = `/courses/${encodeURIComponent(course.documentId)}`;
            let actions = <Link href={courseHref} className="button-primary">View course</Link>;
            if (student && enrollmentsReady) {
              actions = resume
                ? <><Link href={`/learn/${encodeURIComponent(course.documentId)}`} className="button-primary">{studentCourseActionLabel(resume.progress)}</Link><Link href={courseHref} className="context-link">View details</Link></>
                : <Link href={courseHref} className="button-primary">View course</Link>;
            }
            return (
              <li key={course.documentId}>
                <CourseCard course={course} actions={actions} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
