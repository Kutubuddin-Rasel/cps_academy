import type { Metadata } from "next";
import { AdminScreen } from "@/features/admin/admin-screen";
import { ProtectedShell } from "@/features/auth/protected-shell";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return <ProtectedShell allowedRoles={["Admin"]}><AdminScreen /></ProtectedShell>;
}
