"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { createLesson, updateLesson } from "./api";
import type { LessonInput, ManagedLesson } from "./types";

export function LessonForm({ courseId, lesson, onSaved, onCancel }: {
  courseId: string;
  lesson: ManagedLesson | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [content, setContent] = useState(lesson?.content ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl ?? "");
  const [order, setOrder] = useState(lesson?.order.toString() ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => () => { activeRequest.current?.abort(); }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || activeRequest.current) return;
    setError(null);
    const lessonOrder = Number(order);
    if (!title.trim()) { setError("Enter a lesson title."); return; }
    if (!Number.isSafeInteger(lessonOrder) || lessonOrder < 1) { setError("Lesson order must be a positive integer."); return; }
    if (videoUrl.trim()) {
      try {
        const url = new URL(videoUrl.trim());
        if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
          setError("Use an HTTP or HTTPS video URL without embedded credentials.");
          return;
        }
      } catch { setError("Enter a valid video URL, or leave it blank."); return; }
    }
    const input: LessonInput = { title: title.trim(), content: content.trim() ? content : null, videoUrl: videoUrl.trim() || null, order: lessonOrder };
    const controller = new AbortController();
    activeRequest.current = controller;
    setPending(true);
    try {
      if (lesson) await updateLesson(lesson.documentId, input, token, controller.signal);
      else await createLesson(courseId, input, token, controller.signal);
      if (!controller.signal.aborted) onSaved();
    } catch (failure: unknown) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) logout();
      else setError(requestErrorMessage(failure));
    } finally {
      if (activeRequest.current === controller) { activeRequest.current = null; setPending(false); }
    }
  }

  return (
    <form onSubmit={(event) => { void handleSubmit(event); }} className="max-w-3xl space-y-5" aria-busy={pending}>
      <h3 className="text-lg font-semibold">{lesson ? "Edit lesson" : "Add lesson"}</h3>
      <fieldset disabled={pending} className="min-w-0 space-y-5">
        <legend className="sr-only">Lesson details</legend>
        <div><label htmlFor="lesson-title" className="field-label">Lesson title</label><input id="lesson-title" className="field-input" required value={title} onChange={(event) => setTitle(event.target.value)} /></div>
        <div><label htmlFor="lesson-order" className="field-label">Order</label><input id="lesson-order" type="number" min={1} step={1} className="field-input" required value={order} onChange={(event) => setOrder(event.target.value)} /><p className="mt-2 text-sm text-slate-600">Use a positive integer. CPS Academy checks that the order is unique within this course.</p></div>
        <div><label htmlFor="lesson-content" className="field-label">Content (optional)</label><textarea id="lesson-content" className="field-input" rows={8} value={content} onChange={(event) => setContent(event.target.value)} /></div>
        <div><label htmlFor="lesson-video" className="field-label">Video URL (optional)</label><input id="lesson-video" type="url" placeholder="https://…" className="field-input" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} /></div>
        {error ? <p role="alert" className="text-red-800">{error}</p> : null}
        <div className="flex flex-wrap gap-3"><button type="submit" className="button-primary" disabled={pending}>{pending ? "Saving…" : lesson ? "Save lesson" : "Create lesson"}</button><button type="button" className="button-secondary" onClick={onCancel}>Cancel</button></div>
      </fieldset>
    </form>
  );
}
