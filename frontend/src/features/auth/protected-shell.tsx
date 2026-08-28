"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { hasAllowedRole } from "./navigation";
import { SessionLoading, SessionRecovery } from "./session-feedback";
import type { LmsRole } from "./types";

interface ProtectedShellProps {
  children: ReactNode;
  allowedRoles?: readonly LmsRole[];
}

export function ProtectedShell({ children, allowedRoles }: ProtectedShellProps) {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "unauthenticated") router.replace("/login");
  }, [state.status, router]);

  if (state.status === "loading") return <SessionLoading />;
  if (state.status === "error") return <SessionRecovery message={state.message} />;
  if (state.status === "unauthenticated") {
    return (
      <div>
        <SessionLoading message="Please log in to continue. Opening login…" />
        <Link href="/login" className="text-link">Go to login</Link>
      </div>
    );
  }
  // This is a UX guard. Strapi must authorize every protected API request.
  if (allowedRoles && !hasAllowedRole(state.user.role, allowedRoles)) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p role="alert" className="mt-3 text-slate-600">
          {state.user.role === null
            ? "Your account is signed in, but no LMS role is assigned. Contact an administrator for access."
            : "Your current role does not have access to this area."}
        </p>
        <Link href="/account" className="text-link mt-5 inline-block">Back to your account</Link>
      </section>
    );
  }
  return children;
}
