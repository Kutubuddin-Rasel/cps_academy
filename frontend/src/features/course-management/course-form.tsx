"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { createCourse, getInstructors, updateCourse } from "./api";
import type { CourseInput, Instructor, ManagedCourse } from "./types";

interface CourseFormProps {
  course?: ManagedCourse;
  onSaved?: () => void;
  onCancel?: () => void;
}

export function CourseForm({ course, onSaved, onCancel }: CourseFormProps) {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const role = auth.status === "authenticated" ? auth.user.role : null;
  const canAssignInstructor = role === "Admin" || role === "Content Manager";
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [instructorId, setInstructorId] = useState("");
  const [instructors, setInstructors] = useState<Instructor[] | null>(null);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [directoryReload, setDirectoryReload] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ManagedCourse | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (token && canAssignInstructor) {
      void getInstructors(token, controller.signal).then((values) => {
        if (!controller.signal.aborted) { setInstructors(values); setDirectoryError(null); }
      }).catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        if (failure instanceof ApiError && failure.status === 401) logout();
        else setDirectoryError(requestErrorMessage(failure));
      });
    }
    return () => { controller.abort(); activeRequest.current?.abort(); };
  }, [token, canAssignInstructor, logout, directoryReload]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || activeRequest.current || created) return;
    setError(null);
    if (!title.trim()) { setError("Enter a course title."); return; }
    const selectedInstructor = instructors?.find((instructor) => String(instructor.id) === instructorId);
    if (canAssignInstructor && (!course || instructorId !== "") && !selectedInstructor) {
      setError("Choose an instructor from the directory.");
      return;
    }
    const input: CourseInput = { title: title.trim(), description: description.trim() || null };
    if (canAssignInstructor && selectedInstructor) input.instructorId = selectedInstructor.id;
    const controller = new AbortController();
    activeRequest.current = controller;
    setPending(true);
    try {
      if (course) {
        await updateCourse(course.documentId, input, role, token, controller.signal);
        if (controller.signal.aborted) return;
        onSaved?.();
      } else {
        const value = await createCourse(input, role, token, controller.signal);
        if (!controller.signal.aborted) setCreated(value);
      }
    } catch (failure: unknown) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) logout();
      else setError(requestErrorMessage(failure));
    } finally {
      if (activeRequest.current === controller) { activeRequest.current = null; setPending(false); }
    }
  }

  if (created) return (
    <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
      <p role="status" className="text-emerald-900">Course created: {created.title}</p>
      <Link href={`/manage/courses/${encodeURIComponent(created.documentId)}`} className="button-primary">Manage course</Link>
    </div>
  );

  return (
    <form onSubmit={(event) => { void handleSubmit(event); }} className="max-w-3xl space-y-5" aria-busy={pending}>
      <fieldset disabled={pending} className="min-w-0 space-y-5">
        <legend className="sr-only">{course ? "Edit course" : "Create course"}</legend>
        <div><label htmlFor="course-title" className="field-label">Course title</label><input id="course-title" className="field-input" required value={title} onChange={(event) => setTitle(event.target.value)} /></div>
        <div><label htmlFor="course-description" className="field-label">Description (optional)</label><textarea id="course-description" className="field-input" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></div>
        {canAssignInstructor ? (
          <div className="space-y-3">
            <label htmlFor="course-instructor" className="field-label">{course ? "Reassign instructor (optional)" : "Course instructor"}</label>
            <select id="course-instructor" className="field-input min-w-0" required={!course} disabled={!instructors || instructors.length === 0} value={instructorId} onChange={(event) => setInstructorId(event.target.value)}>
              <option value="">{course ? "Keep current instructor" : "Choose an instructor"}</option>
              {instructors?.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.username}</option>)}
            </select>
            {directoryError ? <><p role="alert" className="text-red-800">{directoryError}</p><button type="button" className="button-secondary" onClick={() => { setDirectoryError(null); setInstructors(null); setDirectoryReload((value) => value + 1); }}>Retry instructor directory</button></> : instructors === null ? <p role="status" className="text-sm text-slate-600">Loading instructors…</p> : instructors.length === 0 ? <p className="text-sm text-slate-600">No instructors are available. An instructor is required to create or reassign a course.</p> : null}
          </div>
        ) : <p className="text-sm text-slate-600">{course ? "You can edit this course’s details. Ownership stays unchanged." : "This course will be assigned to you by CPS Academy."}</p>}
        {error ? <p role="alert" className="text-red-800">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="button-primary" disabled={pending || (canAssignInstructor && !course && (!instructors || instructors.length === 0))}>{pending ? "Saving…" : course ? "Save course" : "Create course"}</button>
          {onCancel ? <button type="button" className="button-secondary" onClick={onCancel}>Cancel</button> : null}
        </div>
      </fieldset>
    </form>
  );
}
