"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { getQuizAttempts, getStudentQuiz, submitQuiz } from "./api";
import { formattedAttemptDate } from "./presentation";
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
  const resultRegion = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    if (result) resultRegion.current?.focus();
  }, [result]);

  const answeredCount = quiz?.questions.reduce((count, question) => (
    count + (question.options.some((option) => option.optionKey === answers[question.questionKey]) ? 1 : 0)
  ), 0) ?? 0;
  const allAnswered = quiz !== null && quiz.questions.length > 0 && answeredCount === quiz.questions.length;

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
      <Link href={`/learn/${encodeURIComponent(courseId)}`} className="context-link">← Course overview</Link>
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
          {result ? (
            <section ref={resultRegion} tabIndex={-1} aria-labelledby="quiz-result" className="border-y border-emerald-300 bg-emerald-50 px-5 py-7 focus-visible:outline-blue-700 sm:px-7">
              <p className="font-mono text-sm text-emerald-800">Attempt saved</p>
              <h2 id="quiz-result" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Quiz result</h2>
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 font-mono tabular-nums text-emerald-900">
                <p><span className="text-sm text-slate-600">Score</span><span className="ml-3 text-2xl font-semibold">{result.score} / {result.total}</span></p>
                <p><span className="text-sm text-slate-600">Percentage</span><span className="ml-3 text-2xl font-semibold">{result.percentage}%</span></p>
              </div>
              <Link href={`/learn/${encodeURIComponent(courseId)}`} className="context-link mt-5 text-emerald-900 hover:text-emerald-950">Course overview <span aria-hidden="true">→</span></Link>
            </section>
          ) : null}
          {quiz.questions.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-6">No questions are available in this quiz yet.</p> : (
            <form className="space-y-6" onSubmit={(event) => { void handleSubmit(event); }} aria-describedby="quiz-answer-help">
              <div className="divide-y divide-slate-200 border-y border-slate-200">
                {quiz.questions.map((question, index) => (
                  <fieldset key={question.questionKey} disabled={submitting} className="min-w-0 py-7">
                    <legend className="max-w-full text-lg font-semibold text-slate-950"><span className="mr-2 font-mono text-sm tabular-nums text-blue-700">{String(index + 1).padStart(2, "0")}</span>{question.prompt}</legend>
                    <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {question.options.map((option) => (
                        <label key={option.optionKey} className="flex min-h-12 cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 has-checked:bg-blue-50 motion-reduce:transition-none">
                          <input type="radio" name={`question-${question.questionKey}`} value={option.optionKey} required checked={answers[question.questionKey] === option.optionKey}
                            onChange={() => setAnswers((current) => ({ ...current, [question.questionKey]: option.optionKey }))} className="mt-0.5 size-5 shrink-0 accent-blue-700" />
                          <span className="min-w-0 leading-6">{option.text}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
              {submitError ? <p id="quiz-submit-error" role="alert" className="text-red-800">{submitError}</p> : null}
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p id="quiz-answer-progress" role="status" aria-live="polite" className="font-mono text-sm tabular-nums text-slate-600">{answeredCount} of {quiz.questions.length} answered</p>
                <button type="submit" className="button-primary" disabled={!allAnswered || submitting} aria-describedby={submitError ? "quiz-answer-help quiz-answer-progress quiz-submit-error" : "quiz-answer-help quiz-answer-progress"}>{submitting ? "Submitting…" : result ? "Submit another attempt" : "Submit quiz"}</button>
              </div>
            </form>
          )}
          <section aria-labelledby="quiz-history">
            <h2 id="quiz-history" className="text-xl font-semibold">Previous attempts</h2>
            {historyError ? (
              <div className="mt-4 border-l-2 border-red-700 bg-red-50 px-5 py-4">
                <p role="alert" className="text-red-800">Could not load attempt history. {historyError}</p>
                <button type="button" className="button-secondary mt-4" onClick={() => { setHistoryError(null); setAttempts(null); setHistoryReload((value) => value + 1); }}>Retry history</button>
              </div>
            ) : attempts === null ? <p role="status" className="mt-4">Loading attempt history…</p> : attempts.length === 0 ? (
              <p className="mt-4 text-slate-600">No previous attempts yet. Submit your answers to see your first result.</p>
            ) : (
              <div className="mt-4 overflow-x-auto border-y border-slate-200">
                <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
                  <thead className="text-slate-600"><tr><th scope="col" className="py-3 pr-5 font-medium">Date</th><th scope="col" className="px-5 py-3 font-medium">Score</th><th scope="col" className="py-3 pl-5 text-right font-medium">Percentage</th></tr></thead>
                  <tbody className="divide-y divide-slate-200">
                    {attempts.map((attempt) => (
                      <tr key={attempt.documentId}>
                        <td className="py-4 pr-5"><time dateTime={attempt.createdAt}>{formattedAttemptDate(attempt.createdAt)}</time></td>
                        <td className="px-5 py-4 font-mono tabular-nums">{attempt.score} / {attempt.total}</td>
                        <td className="py-4 pl-5 text-right font-mono tabular-nums">{attempt.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
