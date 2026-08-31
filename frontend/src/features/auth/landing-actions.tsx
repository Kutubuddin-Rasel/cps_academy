"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export function LandingActions() {
  const { state } = useAuth();
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href="/courses" className="button-primary">Browse courses</Link>
      {state.status === "authenticated" ? (
        <Link href={state.user.role === "Student" ? "/my-courses" : "/account"} className="button-secondary">{state.user.role === "Student" ? "Continue learning" : "Open account"}</Link>
      ) : (
        <Link href="#how-learning-works" className="button-secondary">See how it works</Link>
      )}
    </div>
  );
}
