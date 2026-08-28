"use client";

import { useAuth } from "./AuthProvider";

export function AccountOverview() {
  const { state } = useAuth();
  if (state.status !== "authenticated") return null;
  const { user } = state;

  return (
    <div className="space-y-6">
      <section aria-labelledby="account-details" className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="account-details" className="text-lg font-semibold">Account details</h2>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">Signed in</span>
        </div>
        <dl className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="min-w-0"><dt className="text-sm text-slate-600">Username</dt><dd className="mt-1 font-medium [overflow-wrap:anywhere]">{user.username}</dd></div>
          <div className="min-w-0"><dt className="text-sm text-slate-600">Email address</dt><dd className="mt-1 font-medium [overflow-wrap:anywhere]">{user.email}</dd></div>
          <div className="min-w-0"><dt className="text-sm text-slate-600">LMS role</dt><dd className="mt-1 font-medium">{user.role ?? "No LMS role assigned"}</dd></div>
        </dl>
      </section>
      {user.role === null ? (
        <section aria-labelledby="no-role-title" className="rounded-xl border border-amber-300 bg-amber-50 p-6">
          <h2 id="no-role-title" className="font-semibold">No LMS role assigned</h2>
          <p className="mt-2 text-slate-700">Your account is active. Ask an administrator to assign a role for access to learning or management tools. You can still view your account and log out.</p>
        </section>
      ) : null}
      <p className="max-w-2xl text-sm leading-6 text-slate-600">Your identity and role are verified with CPS Academy each time you reload. Sections marked “Coming soon” will be available in a later release.</p>
    </div>
  );
}
