"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { requestErrorMessage } from "@/lib/api/error";
import { useAuth } from "./AuthProvider";

export function RegisterForm() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationError, setConfirmationError] = useState(false);
  const confirmationInput = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setConfirmationError(false);
    if (!username.trim()) {
      setError("Enter a username.");
      return;
    }
    if (password !== confirmation) {
      setConfirmationError(true);
      confirmationInput.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password);
    } catch (error: unknown) {
      setError(requestErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={submitting} aria-describedby={error ? "register-error" : undefined}>
      <div id="register-error" role="alert" aria-atomic="true">
        {error ? <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
      </div>
      <fieldset disabled={submitting} className="space-y-5">
        <legend className="sr-only">Registration details</legend>
        <div>
          <label htmlFor="register-username" className="field-label">Username</label>
          <input id="register-username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
            required value={username} onChange={(event) => setUsername(event.target.value)} className="field-input" />
        </div>
        <div>
          <label htmlFor="register-email" className="field-label">Email address</label>
          <input id="register-email" name="email" type="email" autoComplete="email" autoCapitalize="none"
            required value={email} onChange={(event) => setEmail(event.target.value)} className="field-input" />
        </div>
        <div>
          <label htmlFor="register-password" className="field-label">Password</label>
          <input id="register-password" name="password" type="password" autoComplete="new-password"
            required value={password} onChange={(event) => setPassword(event.target.value)} className="field-input" />
        </div>
        <div>
          <label htmlFor="register-confirmation" className="field-label">Confirm password</label>
          <input ref={confirmationInput} id="register-confirmation" name="confirmation" type="password" autoComplete="new-password"
            required value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setConfirmationError(false); }}
            aria-invalid={confirmationError} aria-describedby={confirmationError ? "confirmation-error" : undefined} className="field-input" />
          {confirmationError ? <p id="confirmation-error" role="alert" className="mt-2 text-sm text-red-800">Passwords must match.</p> : null}
        </div>
        <button type="submit" className="button-primary w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </fieldset>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account? <Link className="text-link" href="/login">Log in</Link>
      </p>
    </form>
  );
}
