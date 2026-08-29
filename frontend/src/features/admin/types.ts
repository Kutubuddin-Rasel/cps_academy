import type { LmsRole } from "@/features/auth/types";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: LmsRole | null;
}

export interface AdminStats {
  users: {
    total: number;
    byRole: Record<LmsRole | "Unassigned", number>;
  };
  courses: { total: number };
  enrollments: { total: number };
}

export interface RoleChangeInput {
  role: LmsRole | null;
}
