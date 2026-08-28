"use client";

import { useAuth } from "./AuthProvider";

export function SessionLoading({ message = "Checking your session…" }: { message?: string }) {
  return <p role="status" className="py-8 text-slate-600">{message}</p>;
}

export function SessionRecovery({ message }: { message: string }) {
  const { refreshSession, logout } = useAuth();
  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-6" aria-labelledby="session-error-title">
      <h2 id="session-error-title" className="text-lg font-semibold">We couldn’t verify your session</h2>
      <p role="alert" className="mt-2 text-slate-700">{message}</p>
      <p className="mt-2 text-sm text-slate-600">You can retry, or sign out to start a new session.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="button-primary" onClick={() => void refreshSession()}>Try again</button>
        <button type="button" className="button-secondary" onClick={logout}>Sign out</button>
      </div>
    </section>
  );
}
