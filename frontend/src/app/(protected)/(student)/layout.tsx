import type { ReactNode } from "react";
import { ProtectedShell } from "@/features/auth/protected-shell";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <ProtectedShell allowedRoles={["Student"]}>{children}</ProtectedShell>;
}
