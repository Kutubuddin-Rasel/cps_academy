"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { requestErrorMessage } from "@/lib/api/error";
import { useAuth } from "./AuthProvider";

export function LoginForm() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    if (!identifier.trim()) {
      setError("Enter your username or email address.");
      return;
    }
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
    } catch (error: unknown) {
      setError(requestErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={submitting} aria-describedby={error ? "login-error" : undefined}>
      <div id="login-error" role="alert" aria-atomic="true">
        {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
      </div>
      <fieldset disabled={submitting} className="space-y-5">
        <legend className="sr-only">Login details</legend>
        <div>
          <label htmlFor="login-identifier" className="field-label">Username or email</label>
          <input id="login-identifier" name="identifier" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
            required value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="field-input" />
        </div>
        <div>
          <label htmlFor="login-password" className="field-label">Password</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password"
            required value={password} onChange={(event) => setPassword(event.target.value)} className="field-input" />
        </div>
        <button type="submit" className="button-primary w-full" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </fieldset>
      <p className="mt-6 text-center text-sm text-slate-600">
        New to CPS Academy? <Link className="text-link" href="/register">Create an account</Link>
      </p>
    </form>
  );
}
