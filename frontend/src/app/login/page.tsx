import type { Metadata } from "next";
import { AuthEntry } from "@/features/auth/auth-entry";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 sm:p-8" aria-labelledby="login-title">
      <p className="text-sm font-medium text-blue-700">Welcome back</p>
      <h1 id="login-title" className="mt-2 text-3xl font-semibold tracking-tight">Log in to CPS Academy</h1>
      <p className="mb-8 mt-3 text-slate-600">Use your username or email to continue.</p>
      <AuthEntry><LoginForm /></AuthEntry>
    </section>
  );
}
