import type { Metadata } from "next";
import { AuthEntry } from "@/features/auth/auth-entry";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 sm:p-8" aria-labelledby="register-title">
      <p className="text-sm font-medium text-blue-700">Join CPS Academy</p>
      <h1 id="register-title" className="mt-2 text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mb-8 mt-3 text-slate-600">New accounts start as Students. Staff roles are assigned by an administrator.</p>
      <AuthEntry><RegisterForm /></AuthEntry>
    </section>
  );
}
