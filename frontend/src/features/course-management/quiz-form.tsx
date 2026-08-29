"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { createQuiz, updateQuiz } from "./api";
import type { ManagedQuiz, QuizInput, StaffQuizQuestion } from "./types";

export function QuizForm({ courseId, quiz, onSaved, onCancel }: {
  courseId: string;
  quiz: ManagedQuiz | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [questions, setQuestions] = useState<StaffQuizQuestion[]>(quiz?.questions ?? []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => () => { activeRequest.current?.abort(); }, [token]);

  function addQuestion() {
    // UUIDs satisfy the backend's stable, non-empty, trimmed key contract.
    const question: StaffQuizQuestion = {
      questionKey: crypto.randomUUID(), prompt: "", correctOptionKey: "",
      options: [{ optionKey: crypto.randomUUID(), text: "" }, { optionKey: crypto.randomUUID(), text: "" }],
    };
    setQuestions((current) => [...current, question]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || activeRequest.current) return;
    setError(null);
    if (!title.trim()) { setError("Enter a quiz title."); return; }
    if (questions.length === 0) { setError("Add at least one question."); return; }
    for (const [index, question] of questions.entries()) {
      if (!question.prompt.trim() || question.options.length < 2 || question.options.some((option) => !option.text.trim())
        || !question.options.some((option) => option.optionKey === question.correctOptionKey)) {
        setError(`Question ${index + 1} needs a prompt, at least two filled options, and one correct answer.`);
        return;
      }
    }
    const input: QuizInput = {
      title: title.trim(),
      questions: questions.map((question) => ({
        ...question, prompt: question.prompt.trim(),
        options: question.options.map((option) => ({ ...option, text: option.text.trim() })),
      })),
    };
    const controller = new AbortController();
    activeRequest.current = controller;
    setPending(true);
    try {
      if (quiz) await updateQuiz(quiz.documentId, input, token, controller.signal);
      else await createQuiz(courseId, input, token, controller.signal);
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
      <h3 className="text-lg font-semibold">{quiz ? "Edit quiz" : "Add quiz"}</h3>
      <p className="text-sm text-slate-600">Each question needs at least two options and one correct answer. Saving replaces the full question list.</p>
      <fieldset disabled={pending} className="min-w-0 space-y-6">
        <legend className="sr-only">Quiz details</legend>
        <div><label htmlFor="quiz-title" className="field-label">Quiz title</label><input id="quiz-title" className="field-input" required value={title} onChange={(event) => setTitle(event.target.value)} /></div>
        {questions.length === 0 ? <p className="text-slate-600">No questions yet. Add a question to get started.</p> : null}
        {questions.map((question, questionIndex) => (
          <fieldset key={question.questionKey} className="min-w-0 space-y-5 rounded-xl border border-slate-300 p-4 sm:p-5">
            <legend className="max-w-full px-2 font-semibold">Question {questionIndex + 1}</legend>
            <label className="block"><span className="field-label">Question prompt</span><textarea className="field-input" rows={2} required value={question.prompt}
              onChange={(event) => setQuestions((current) => current.map((item) => item.questionKey === question.questionKey ? { ...item, prompt: event.target.value } : item))} /></label>
            <div className="space-y-4">
              {question.options.map((option, optionIndex) => (
                <div key={option.optionKey} className="min-w-0 space-y-3 rounded-lg border border-slate-200 p-3">
                  <label className="block"><span className="field-label">Option {optionIndex + 1}</span><input className="field-input" required value={option.text}
                    onChange={(event) => setQuestions((current) => current.map((item) => item.questionKey === question.questionKey
                      ? { ...item, options: item.options.map((choice) => choice.optionKey === option.optionKey ? { ...choice, text: event.target.value } : choice) } : item))} /></label>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex min-h-11 items-center gap-3"><input type="radio" name={`correct-${question.questionKey}`} required checked={question.correctOptionKey === option.optionKey} value={option.optionKey} aria-label={`Option ${optionIndex + 1} is the correct answer for question ${questionIndex + 1}`}
                      onChange={() => setQuestions((current) => current.map((item) => item.questionKey === question.questionKey ? { ...item, correctOptionKey: option.optionKey } : item))} className="size-5 shrink-0 accent-blue-700" /><span className="text-sm">Correct answer</span></label>
                    <button type="button" className="button-secondary text-red-800" disabled={question.options.length <= 2} aria-label={`Remove option ${optionIndex + 1} from question ${questionIndex + 1}`}
                      onClick={() => setQuestions((current) => current.map((item) => item.questionKey === question.questionKey ? {
                        ...item, options: item.options.filter((choice) => choice.optionKey !== option.optionKey),
                        correctOptionKey: item.correctOptionKey === option.optionKey ? "" : item.correctOptionKey,
                      } : item))}>Remove option</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="button-secondary" onClick={() => {
                const optionKey = crypto.randomUUID();
                setQuestions((current) => current.map((item) => item.questionKey === question.questionKey ? { ...item, options: [...item.options, { optionKey, text: "" }] } : item));
              }}>Add option</button>
              <button type="button" className="button-secondary text-red-800" disabled={questions.length <= 1} aria-label={`Remove question ${questionIndex + 1}`}
                onClick={() => setQuestions((current) => current.filter((item) => item.questionKey !== question.questionKey))}>Remove question</button>
            </div>
          </fieldset>
        ))}
        <button type="button" className="button-secondary" onClick={addQuestion}>Add question</button>
        {error ? <p role="alert" className="text-red-800">{error}</p> : null}
        <div className="flex flex-wrap gap-3"><button type="submit" className="button-primary" disabled={pending || questions.length === 0}>{pending ? "Saving…" : quiz ? "Save quiz" : "Create quiz"}</button><button type="button" className="button-secondary" onClick={onCancel}>Cancel</button></div>
      </fieldset>
    </form>
  );
}
