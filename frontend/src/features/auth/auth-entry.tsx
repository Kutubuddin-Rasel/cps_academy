"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { SessionLoading, SessionRecovery } from "./session-feedback";

export function AuthEntry({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "authenticated") router.replace("/account");
  }, [state.status, router]);

  if (state.status === "loading") return <SessionLoading />;
  if (state.status === "error") return <SessionRecovery message={state.message} />;
  if (state.status === "authenticated") {
    return (
      <div>
        <SessionLoading message="Opening your account…" />
        <Link className="text-link" href="/account">Continue to your account</Link>
      </div>
    );
  }
  return children;
}
