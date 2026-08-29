"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { deleteCourse, deleteLesson, deleteQuiz, getManagedContent, getManagedCourse } from "./api";
import { CourseForm } from "./course-form";
import { LessonForm } from "./lesson-form";
import { QuizForm } from "./quiz-form";
import { StudentProgressSection } from "./student-progress-section";
import type { ManagedContent, ManagedCourse, ManagedLesson, ManagedQuiz } from "./types";

type Editor =
  | { kind: "course" }
  | { kind: "lesson"; lesson: ManagedLesson | null }
  | { kind: "quiz"; quiz: ManagedQuiz | null };

export function CourseManagement({ courseId }: { courseId: string }) {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const [data, setData] = useState<{ course: ManagedCourse; content: ManagedContent } | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [reload, setReload] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const deletionRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void Promise.all([
      getManagedCourse(courseId, token, controller.signal),
      getManagedContent(courseId, token, controller.signal),
    ])
      .then(([course, content]) => {
        if (!controller.signal.aborted) {
          setData({ course, content });
          setLoadError(null);
        }
      }).catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        if (failure instanceof ApiError && failure.status === 401) logout();
        else setLoadError(failure instanceof ApiError ? failure : new ApiError(0, requestErrorMessage(failure)));
      });
    return () => { controller.abort(); deletionRequest.current?.abort(); };
  }, [courseId, token, logout, reload]);

  function refresh(message: string) {
    setNotice(message);
    setActionError(null);
    setEditor(null);
    setData(null);
    setLoadError(null);
    setReload((value) => value + 1);
  }

  async function remove(kind: "Course" | "Lesson" | "Quiz", documentId: string, title: string) {
    if (!token || editor || deletionRequest.current || !window.confirm(`Delete ${kind.toLowerCase()} “${title}”? This cannot be undone.`)) return;
    const controller = new AbortController();
    deletionRequest.current = controller;
    setDeleting(true);
    setActionError(null);
    setNotice(null);
    try {
      if (kind === "Course") await deleteCourse(documentId, token, controller.signal);
      else if (kind === "Lesson") await deleteLesson(documentId, token, controller.signal);
      else await deleteQuiz(documentId, token, controller.signal);
      if (controller.signal.aborted) return;
      if (kind === "Course") setDeleted(true);
      else refresh(`${kind} deleted.`);
    } catch (failure: unknown) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) logout();
      else setActionError(requestErrorMessage(failure));
    } finally {
      if (deletionRequest.current === controller) {
        deletionRequest.current = null;
        setDeleting(false);
      }
    }
  }

  const busy = deleting || editor !== null;

  return (
    <div className="space-y-8 [overflow-wrap:anywhere]">
      <Link href="/manage/courses" className="text-link">Back to Manage Courses</Link>
      {deleted ? (
        <>
          <h1 className="text-3xl font-semibold">Course deleted</h1>
          <p role="status">The course was deleted successfully.</p>
        </>
      ) : (
        <>
          {notice ? <p role="status" className="text-emerald-800">{notice}</p> : null}
          {actionError ? <p role="alert" className="text-red-800">{actionError}</p> : null}
          {deleting ? <p role="status">Deleting…</p> : null}
          {loadError ? (
            <section className="rounded-xl border border-red-200 bg-white p-6">
              <h1 className="text-2xl font-semibold">
                {loadError.status === 403 ? "Course access denied" : loadError.status === 404 ? "Course not found" : "Course management unavailable"}
              </h1>
              <p role="alert" className="mt-3 text-red-800">{loadError.message}</p>
              <button type="button" className="button-secondary mt-4" onClick={() => {
                setLoadError(null);
                setData(null);
                setReload((value) => value + 1);
              }}>Try again</button>
            </section>
          ) : data === null ? (
            <>
              <h1 className="text-3xl font-semibold">Manage course</h1>
              <p role="status">Loading course management…</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-semibold tracking-tight">{data.course.title}</h1>
              <section aria-labelledby="managed-course-details" className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 id="managed-course-details" className="text-xl font-semibold">Course details</h2>
                {editor?.kind === "course" ? (
                  <CourseForm course={data.course} onSaved={() => refresh("Course saved.")} onCancel={() => setEditor(null)} />
                ) : (
                  <>
                    <p className="max-w-3xl whitespace-pre-line leading-7 text-slate-600">{data.course.description || "No description provided."}</p>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" className="button-secondary" disabled={busy}
                        onClick={() => setEditor({ kind: "course" })}>Edit course</button>
                      <button type="button" className="button-secondary text-red-800" disabled={busy}
                        onClick={() => { void remove("Course", data.course.documentId, data.course.title); }}>Delete course</button>
                    </div>
                  </>
                )}
              </section>
              <section aria-labelledby="managed-lessons" className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="managed-lessons" className="text-xl font-semibold">Lessons</h2>
                  <button type="button" className="button-secondary" disabled={busy}
                    onClick={() => setEditor({ kind: "lesson", lesson: null })}>Add lesson</button>
                </div>
                {editor?.kind === "lesson" ? (
                  <LessonForm key={editor.lesson?.documentId ?? "new"} courseId={courseId} lesson={editor.lesson}
                    onSaved={() => refresh("Lesson saved.")} onCancel={() => setEditor(null)} />
                ) : null}
                {data.content.lessons.length === 0 ? (
                  <p className="text-slate-600">No lessons yet. Add the first lesson for this course.</p>
                ) : (
                  <ol className="space-y-3">
                    {data.content.lessons.map((lesson) => (
                      <li key={lesson.documentId} className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
                        <h3 className="min-w-0 flex-1 basis-48 font-medium">{lesson.order}. {lesson.title}</h3>
                        <div className="flex flex-wrap gap-3">
                          <button type="button" className="button-secondary" disabled={busy}
                            onClick={() => setEditor({ kind: "lesson", lesson })}>Edit lesson</button>
                          <button type="button" className="button-secondary text-red-800" disabled={busy}
                            onClick={() => { void remove("Lesson", lesson.documentId, lesson.title); }}>Delete lesson</button>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
              <section aria-labelledby="managed-quizzes" className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="managed-quizzes" className="text-xl font-semibold">Quizzes</h2>
                  <button type="button" className="button-secondary" disabled={busy}
                    onClick={() => setEditor({ kind: "quiz", quiz: null })}>Add quiz</button>
                </div>
                {editor?.kind === "quiz" ? (
                  <QuizForm key={editor.quiz?.documentId ?? "new"} courseId={courseId} quiz={editor.quiz}
                    onSaved={() => refresh("Quiz saved.")} onCancel={() => setEditor(null)} />
                ) : null}
                {data.content.quizzes.length === 0 ? (
                  <p className="text-slate-600">No quizzes yet. Add a quiz to this course.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.content.quizzes.map((quiz) => (
                      <li key={quiz.documentId} className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
                        <div className="min-w-0 flex-1 basis-48">
                          <h3 className="font-medium">{quiz.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">{quiz.questions.length} questions</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button type="button" className="button-secondary" disabled={busy}
                            onClick={() => setEditor({ kind: "quiz", quiz })}>Edit quiz</button>
                          <button type="button" className="button-secondary text-red-800" disabled={busy}
                            onClick={() => { void remove("Quiz", quiz.documentId, quiz.title); }}>Delete quiz</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <StudentProgressSection courseId={courseId} />
            </>
          )}
        </>
      )}
    </div>
  );
}
