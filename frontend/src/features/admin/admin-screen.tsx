"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import type { LmsRole } from "@/features/auth/types";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { changeUserRole, getAdminStats, getAdminUsers } from "./api";
import { isManagedRole } from "./parsers";
import type { AdminStats, AdminUser } from "./types";

const roles: LmsRole[] = ["Admin", "Content Manager", "Instructor", "Student"];
const countLabels: (LmsRole | "Unassigned")[] = [...roles, "Unassigned"];

export function AdminScreen() {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const [data, setData] = useState<{ stats: AdminStats; users: AdminUser[] } | null>(null);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [reload, setReload] = useState(0);
  const [draftRoles, setDraftRoles] = useState<Record<number, LmsRole | null>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<{ userId: number; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const mutationRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void Promise.all([getAdminStats(token, controller.signal), getAdminUsers(token, controller.signal)])
      .then(([stats, users]) => {
        if (!controller.signal.aborted) {
          setData({ stats, users });
          setLoadError(null);
        }
      }).catch((failure: unknown) => {
        if (controller.signal.aborted) return;
        if (failure instanceof ApiError && failure.status === 401) logout();
        else setLoadError(failure instanceof ApiError ? failure : new ApiError(0, requestErrorMessage(failure)));
      });
    return () => controller.abort();
  }, [token, logout, reload]);

  useEffect(() => () => mutationRequest.current?.abort(), [token]);

  function refresh() {
    setData(null);
    setLoadError(null);
    setReload((value) => value + 1);
  }

  async function saveRole(userId: number, role: LmsRole | null) {
    if (!token || mutationRequest.current) return;
    const controller = new AbortController();
    mutationRequest.current = controller;
    setSavingId(userId);
    setActionError(null);
    setNotice(null);
    try {
      const updated = await changeUserRole(userId, { role }, token, controller.signal);
      if (controller.signal.aborted) return;
      setNotice(`Role updated for ${updated.username}.`);
      setDraftRoles((current) => {
        const next = { ...current };
        delete next[userId];
        return next;
      });
      refresh();
    } catch (failure: unknown) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) logout();
      else setActionError({ userId, message: requestErrorMessage(failure) });
    } finally {
      if (mutationRequest.current === controller) {
        mutationRequest.current = null;
        if (!controller.signal.aborted) setSavingId(null);
      }
    }
  }

  return (
    <div className="min-w-0 space-y-8 [overflow-wrap:anywhere]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-3 text-slate-600">Platform totals and application user roles.</p>
        </div>
        <button type="button" className="button-secondary" onClick={refresh}
          disabled={savingId !== null || (data === null && loadError === null)}>Refresh users and stats</button>
      </header>
      {notice ? <p role="status" className="text-emerald-800">{notice}</p> : null}
      {loadError ? (
        <section className="rounded-xl border border-red-200 bg-white p-5 sm:p-6">
          <h2 className="text-xl font-semibold">{loadError.status === 403 ? "Admin access denied" : "Admin data unavailable"}</h2>
          <p role="alert" className="mt-3 text-red-800">{loadError.message}</p>
          <button type="button" className="button-secondary mt-4" onClick={refresh}>Try again</button>
        </section>
      ) : data === null ? (
        <p role="status" className="text-slate-600">Loading users and platform stats…</p>
      ) : (
        <>
          <section aria-labelledby="admin-stats-heading" className="space-y-5">
            <h2 id="admin-stats-heading" className="text-xl font-semibold">Platform stats</h2>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total users", count: data.stats.users.total },
                { label: "Courses", count: data.stats.courses.total },
                { label: "Enrollments", count: data.stats.enrollments.total },
                ...countLabels.map((label) => ({ label, count: data.stats.users.byRole[label] })),
              ].map(({ label, count }) => (
                <div key={label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
                  <dt className="text-sm text-slate-600">{label}</dt>
                  <dd className="mt-2 text-2xl font-semibold tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="admin-users-heading" className="space-y-5">
            <h2 id="admin-users-heading" className="text-xl font-semibold">Users and roles</h2>
            <p className="text-sm text-slate-600">Choose a role and save the change. No LMS role keeps the account signed in without LMS access.</p>
            {data.users.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">No application users found.</p>
            ) : (
              <ul className="space-y-4">
                {data.users.map((user) => {
                  const draft = draftRoles[user.id];
                  const selectedRole = draft === undefined ? user.role : draft;
                  const error = actionError?.userId === user.id ? actionError.message : null;
                  return (
                    <li key={user.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                      <form aria-label={`Change role for ${user.username}`} className="grid min-w-0 gap-5 md:grid-cols-2"
                        onSubmit={(event) => { event.preventDefault(); void saveRole(user.id, selectedRole); }}>
                        <div className="min-w-0 space-y-2">
                          <h3 className="font-semibold">{user.username}</h3>
                          <p className="text-sm text-slate-600">{user.email}</p>
                          <p className="text-sm">Current role: <span className="font-medium">{user.role ?? "No LMS role"}</span></p>
                        </div>
                        <fieldset disabled={savingId !== null} className="min-w-0 space-y-3">
                          <legend className="sr-only">Role change</legend>
                          <label className="field-label" htmlFor={`admin-role-${user.id}`}>New role</label>
                          <select id={`admin-role-${user.id}`} className="field-input min-w-0" value={selectedRole ?? ""}
                            aria-describedby={error ? `admin-role-error-${user.id}` : undefined}
                            onChange={(event) => {
                              const role = event.target.value === "" ? null : event.target.value;
                              if (isManagedRole(role)) setDraftRoles((current) => ({ ...current, [user.id]: role }));
                              if (actionError?.userId === user.id) setActionError(null);
                            }}>
                            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                            <option value="">No LMS role</option>
                          </select>
                          <button type="submit" className="button-primary" disabled={savingId !== null || selectedRole === user.role}>
                            {savingId === user.id ? "Saving role…" : "Save role"}
                          </button>
                          {error ? <p id={`admin-role-error-${user.id}`} role="alert" className="text-sm text-red-800">{error}</p> : null}
                        </fieldset>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
