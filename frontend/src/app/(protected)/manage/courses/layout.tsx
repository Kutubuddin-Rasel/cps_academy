import type { ReactNode } from "react";
import { ProtectedShell } from "@/features/auth/protected-shell";

export default function StaffCoursesLayout({ children }: { children: ReactNode }) {
  return <ProtectedShell allowedRoles={["Admin", "Content Manager", "Instructor"]}>{children}</ProtectedShell>;
}
