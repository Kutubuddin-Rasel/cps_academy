import type { Metadata } from "next";
import { AccountOverview } from "@/features/auth/account-overview";

export const metadata: Metadata = { title: "Your account" };

export default function AccountPage() {
  return (
    <div>
      <p className="text-sm font-medium text-blue-700">CPS Academy</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your account</h1>
      <p className="mb-8 mt-3 text-slate-600">Welcome. Here’s your account information and current access.</p>
      <AccountOverview />
    </div>
  );
}
