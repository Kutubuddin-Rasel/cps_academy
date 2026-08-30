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
  const publicItems: NavigationItem[] = [
    { label: "Courses", href: "/courses" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
  ];

  if (role === "Student") return [{ label: "My Courses", href: "/my-courses" }, ...publicItems];
  if (role === "Instructor") return [{ label: "Manage Courses", href: "/manage/courses" }, ...publicItems];
  if (role === "Content Manager") {
    return [
      { label: "Manage Courses", href: "/manage/courses" },
      { label: "Manage Blog", href: "/manage/blog" },
      ...publicItems,
    ];
  }
  if (role === "Admin") {
    return [
      { label: "Admin", href: "/admin" },
      { label: "Manage Courses", href: "/manage/courses" },
      { label: "Manage Blog", href: "/manage/blog" },
      ...publicItems,
    ];
  }
  return publicItems;
}

export function isNavigationItemActive(pathname: string, href: string): boolean {
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (href === "/my-courses" && normalizedPathname.startsWith("/learn/")) return true;
  if (href === "/account" || href === "/about" || href === "/my-courses") {
    return normalizedPathname === href;
  }

  return normalizedPathname === href || normalizedPathname.startsWith(`${href}/`);
}
