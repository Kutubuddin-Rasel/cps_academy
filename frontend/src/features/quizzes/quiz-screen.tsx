"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { getQuizAttempts, getStudentQuiz, submitQuiz } from "./api";
import type { QuizAnswer, QuizAttempt, QuizResult, StudentQuiz } from "./types";

export function QuizScreen({ courseId, quizId }: { courseId: string; quizId: string }) {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const [quiz, setQuiz] = useState<StudentQuiz | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [reload, setReload] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyReload, setHistoryReload] = useState(0);
  const submissionRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void getStudentQuiz(quizId, token, controller.signal).then((value) => {
      if (!controller.signal.aborted) { setQuiz(value); setLoadError(null); }
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else setLoadError(error instanceof ApiError ? error : new ApiError(0, requestErrorMessage(error)));
    });
    return () => { controller.abort(); submissionRequest.current?.abort(); };
  }, [quizId, token, logout, reload]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void getQuizAttempts(quizId, token, controller.signal).then((values) => {
      if (!controller.signal.aborted) { setAttempts(values); setHistoryError(null); }
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else setHistoryError(requestErrorMessage(error));
    });
    return () => controller.abort();
  }, [quizId, token, logout, historyReload]);

  const allAnswered = quiz !== null && quiz.questions.length > 0 && quiz.questions.every((question) => (
    question.options.some((option) => option.optionKey === answers[question.questionKey])
  ));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !quiz || !allAnswered || submissionRequest.current) return;
    const submittedAnswers: QuizAnswer[] = quiz.questions.flatMap(({ questionKey }) => {
      const selectedOptionKey = answers[questionKey];
      return typeof selectedOptionKey === "string" ? [{ questionKey, selectedOptionKey }] : [];
    });
    const controller = new AbortController();
    submissionRequest.current = controller;
    setSubmitting(true);
    setSubmitError(null);
    setResult(null);
    try {
      const savedResult = await submitQuiz(quiz.documentId, submittedAnswers, token, controller.signal);
      if (controller.signal.aborted) return;
      setResult(savedResult);
      // A history failure must not hide a successfully saved score or invite an accidental resubmit.
      setAttempts(null);
      setHistoryError(null);
      setHistoryReload((value) => value + 1);
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else setSubmitError(requestErrorMessage(error));
    } finally {
      if (submissionRequest.current === controller) {
        submissionRequest.current = null;
        setSubmitting(false);
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 [overflow-wrap:anywhere]">
      <Link href={`/learn/${encodeURIComponent(courseId)}`} className="text-link">Back to course overview</Link>
      {loadError ? (
        <section className="rounded-xl border border-red-200 bg-white p-6">
          <h1 className="text-2xl font-semibold">{loadError.status === 403 ? "Quiz access denied" : loadError.status === 404 ? "Quiz not found" : "Quiz unavailable"}</h1>
          <p role="alert" className="mt-3 text-red-800">{loadError.message}</p>
          <button type="button" className="button-secondary mt-4" onClick={() => { setLoadError(null); setQuiz(null); setReload((value) => value + 1); }}>Try again</button>
        </section>
      ) : !quiz ? (
        <><h1 className="text-3xl font-semibold">Quiz</h1><p role="status">Loading quiz…</p></>
      ) : (
        <>
          <div><h1 className="text-3xl font-semibold tracking-tight">{quiz.title}</h1><p id="quiz-answer-help" className="mt-3 text-slate-600">Choose one answer for every question before submitting.</p></div>
          {quiz.questions.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-6">No questions are available in this quiz yet.</p> : (
            <form className="space-y-6" onSubmit={(event) => { void handleSubmit(event); }} aria-describedby="quiz-answer-help">
              {quiz.questions.map((question, index) => (
                <fieldset key={question.questionKey} disabled={submitting} className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                  <legend className="max-w-full px-2 text-lg font-semibold">{index + 1}. {question.prompt}</legend>
                  <div className="space-y-3">
                    {question.options.map((option) => (
                      <label key={option.optionKey} className="flex min-h-11 items-start gap-3 rounded-lg border border-slate-300 p-3 has-checked:border-blue-700 has-checked:bg-blue-50">
                        <input type="radio" name={`question-${question.questionKey}`} value={option.optionKey} required checked={answers[question.questionKey] === option.optionKey}
                          onChange={() => setAnswers((current) => ({ ...current, [question.questionKey]: option.optionKey }))} className="mt-0.5 size-5 shrink-0 accent-blue-700" />
                        <span className="min-w-0 leading-6">{option.text}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              {submitError ? <p id="quiz-submit-error" role="alert" className="text-red-800">{submitError}</p> : null}
              <button type="submit" className="button-primary" disabled={!allAnswered || submitting} aria-describedby={submitError ? "quiz-submit-error" : "quiz-answer-help"}>{submitting ? "Submitting…" : result ? "Submit another attempt" : "Submit quiz"}</button>
            </form>
          )}
          {result ? (
            <section aria-labelledby="quiz-result" className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <h2 id="quiz-result" className="text-xl font-semibold">Latest result</h2>
              <p role="status" className="mt-3 text-lg font-medium text-emerald-900">Score: {result.score} / {result.total} · {result.percentage}%</p>
              <p className="mt-2 text-sm text-slate-700">Your attempt has been saved. You can change your answers and submit another attempt.</p>
            </section>
          ) : null}
          <section aria-labelledby="quiz-history" className="space-y-4">
            <h2 id="quiz-history" className="text-xl font-semibold">Previous attempts</h2>
            {historyError ? (
              <div className="rounded-xl border border-red-200 bg-white p-6">
                <p role="alert" className="text-red-800">Could not load attempt history. {historyError}</p>
                <button type="button" className="button-secondary mt-4" onClick={() => { setHistoryError(null); setAttempts(null); setHistoryReload((value) => value + 1); }}>Retry history</button>
              </div>
            ) : attempts === null ? <p role="status">Loading attempt history…</p> : attempts.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-6">No previous attempts yet. Submit your answers to see your first result.</p>
            ) : (
              <ol className="space-y-3">
                {attempts.map((attempt) => (
                  <li key={attempt.documentId} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
                    <p className="font-medium">Score: {attempt.score} / {attempt.total} · {attempt.percentage}%</p>
                    <time dateTime={attempt.createdAt} className="text-sm text-slate-600">{new Date(attempt.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
