import type { ReactNode } from "react";
import { ProtectedShell } from "@/features/auth/protected-shell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
