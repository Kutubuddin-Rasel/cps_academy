"use client";

import { useAuth } from "./AuthProvider";

export function AccountOverview() {
  const { state } = useAuth();
  if (state.status !== "authenticated") return null;
  const { user } = state;

  return (
    <div className="max-w-3xl space-y-6">
      <section aria-labelledby="account-details" className="border-y border-slate-200 bg-white">
        <h2 id="account-details" className="sr-only">Account details</h2>
        <dl className="divide-y divide-slate-200">
          <div className="grid min-w-0 gap-1 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8"><dt className="text-sm text-slate-600">Username</dt><dd className="font-medium [overflow-wrap:anywhere]">{user.username}</dd></div>
          <div className="grid min-w-0 gap-1 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8"><dt className="text-sm text-slate-600">Email</dt><dd className="font-medium [overflow-wrap:anywhere]">{user.email}</dd></div>
          <div className="grid min-w-0 gap-1 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8"><dt className="text-sm text-slate-600">Role</dt><dd className="font-medium">{user.role ?? "No role assigned"}</dd></div>
        </dl>
      </section>
      {user.role === null ? (
        <section aria-labelledby="no-role-title" className="border-l-2 border-amber-500 bg-amber-50 px-5 py-4">
          <h2 id="no-role-title" className="font-semibold">No role assigned</h2>
          <p className="mt-2 text-slate-700">Your account is active. Ask an administrator to assign a role for access to learning or management tools. You can still view your account and log out.</p>
        </section>
      ) : null}
    </div>
  );
}
