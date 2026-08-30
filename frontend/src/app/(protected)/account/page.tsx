import type { Metadata } from "next";
import { AccountOverview } from "@/features/auth/account-overview";

export const metadata: Metadata = { title: "Your account" };

export default function AccountPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Your account</h1>
      <p className="mb-8 mt-3 text-slate-600">Your sign-in details and role.</p>
      <AccountOverview />
    </div>
  );
}
