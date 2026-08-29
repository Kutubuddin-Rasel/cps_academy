import type { LmsRole } from "./types";

interface NavigationItem {
  label: string;
  href: string;
}

export function hasAllowedRole(role: LmsRole | null, allowedRoles: readonly LmsRole[]): boolean {
  return role !== null && allowedRoles.includes(role);
}

export function isStaffRole(role: LmsRole | null): boolean {
  return role === "Admin" || role === "Content Manager" || role === "Instructor";
}

export function canManageBlog(role: LmsRole | null): boolean {
  return role === "Admin" || role === "Content Manager";
}

export function getNavigationItems(role: LmsRole | null): NavigationItem[] {
  const items: NavigationItem[] = [{ label: "Account", href: "/account" }];
  if (role === "Admin") items.push({ label: "Admin", href: "/admin" });
  items.push({ label: "Courses", href: "/courses" });
  if (role === "Student") items.push({ label: "My Courses", href: "/my-courses" });
  if (isStaffRole(role)) items.push({ label: "Manage Courses", href: "/manage/courses" });
  if (canManageBlog(role)) items.push({ label: "Manage Blog", href: "/manage/blog" });
  items.push({ label: "Blog", href: "/blog" });
  items.push({ label: "About", href: "/about" });
  return items;
}
