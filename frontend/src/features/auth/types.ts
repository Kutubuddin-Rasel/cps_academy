export type LmsRole = "Admin" | "Content Manager" | "Instructor" | "Student";

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  role: LmsRole | null;
}

export type ResolvedAuthState =
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: CurrentUser; token: string }
  | { status: "error"; message: string };

export type AuthState = { status: "loading" } | ResolvedAuthState;
