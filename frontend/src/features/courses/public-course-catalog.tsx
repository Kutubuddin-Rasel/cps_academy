"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { getCourseProgress } from "@/features/learning/api";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { getEnrollments } from "./api";
import { CourseCard } from "./course-card";
import { filterPublicCourses, publicCourseGridClassName } from "./public-course-layout";
import { buildStudentCourseResumes, studentCourseActionLabel } from "./student-course-resume";
import type { StudentCourseResume } from "./student-course-resume";
import type { PublicCourseSummary } from "./types";

export function PublicCourseCatalog({ courses, errorMessage }: { courses: PublicCourseSummary[]; errorMessage: string | null }) {
  const router = useRouter();
  const { state: auth, logout } = useAuth();
  const student = auth.status === "authenticated" && auth.user.role === "Student";
  const token = student ? auth.token : null;
  const [resumes, setResumes] = useState<StudentCourseResume[]>([]);
  const [loadedToken, setLoadedToken] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ courseId: string; message: string; error: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
  const visibleCourses = filterPublicCourses(courses, searchQuery);
  const resultLabel = `${visibleCourses.length} ${visibleCourses.length === 1 ? "course" : "courses"} found`;

  return (
    <div className="space-y-10 sm:space-y-12">
      <header className="max-w-4xl border-b border-slate-200 pb-8 sm:pb-10">
        <div className="border-l-4 border-[var(--brand-brass)] pl-4">
          <p className="section-kicker">Course catalog</p>
        </div>
        <h1 className="page-heading">Courses built for steady progress.</h1>
        <p className="page-intro">Explore every available course, meet the instructor, and review the syllabus before you enroll.</p>
      </header>
      {feedback?.courseId === "" ? <p role="alert" className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-red-800">{feedback.message}</p> : null}
      {errorMessage ? (
        <div className="max-w-3xl rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p role="alert" className="text-red-800">{errorMessage}</p>
          <button type="button" className="button-secondary mt-4" onClick={() => router.refresh()}>Try again</button>
        </div>
      ) : courses.length === 0 ? (
        <div className="max-w-3xl rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10">
          <h2 className="text-lg font-semibold text-slate-950">No courses are available yet</h2>
          <p className="mt-2 text-slate-600">Please check back later for new learning opportunities.</p>
        </div>
      ) : (
        <section aria-labelledby="catalog-results-heading" className="space-y-6">
          <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-end sm:justify-between sm:p-5">
            <div>
              <h2 id="catalog-results-heading" className="text-lg font-semibold text-slate-950">Available courses</h2>
              <p aria-live="polite" aria-atomic="true" className="mt-1 text-sm font-medium text-slate-600">{resultLabel}</p>
            </div>
            <div role="search" aria-label="Course catalog" className="w-full sm:max-w-sm">
              <label htmlFor="course-search" className="field-label">Search courses</label>
              <div className="flex items-center gap-2">
                <input
                  id="course-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="field-input min-w-0"
                  placeholder="Title or instructor"
                />
                {searchQuery.length > 0 ? (
                  <button type="button" className="button-tertiary shrink-0" onClick={() => setSearchQuery("")}>Clear</button>
                ) : null}
              </div>
            </div>
          </div>

          {visibleCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <h3 className="text-lg font-semibold text-slate-950">No matching courses</h3>
              <p className="mx-auto mt-2 max-w-md text-slate-600">Try a different course title or instructor name.</p>
            </div>
          ) : (
            <ul className={publicCourseGridClassName(visibleCourses.length)}>
              {visibleCourses.map((course) => {
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
        </section>
      )}
    </div>
  );
}
