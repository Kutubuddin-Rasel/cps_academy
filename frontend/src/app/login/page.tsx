import type { Metadata } from "next";
import { AuthEntry } from "@/features/auth/auth-entry";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md rounded-xl border border-slate-200 border-t-4 border-t-blue-700 bg-white p-6 sm:p-8" aria-labelledby="login-title">
      <p className="section-kicker">CPS Academy</p>
      <h1 id="login-title" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Log in</h1>
      <p className="mb-7 mt-3 leading-7 text-slate-600">Use your username or email to return to your courses and account.</p>
      <AuthEntry><LoginForm /></AuthEntry>
    </section>
  );
}
