"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { getNavigationItems } from "./navigation";

export function AppHeader() {
  const { state, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex min-h-11 items-center gap-3 font-semibold tracking-tight">
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-sm text-white">CPS</span>
          <span>CPS Academy</span>
        </Link>
        {state.status === "authenticated" ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="max-w-56 truncate text-sm text-slate-600">
              <span className="font-medium text-slate-900">{state.user.username}</span>
              <span className="block text-xs">{state.user.role ?? "No LMS role"}</span>
            </p>
            <button type="button" className="button-secondary" onClick={() => { setMenuOpen(false); logout(); }}>Log out</button>
            <button type="button" className="button-secondary lg:hidden" aria-expanded={menuOpen} aria-controls="account-navigation"
              onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? "Close menu" : "Menu"}</button>
          </div>
        ) : state.status === "unauthenticated" ? (
          <nav aria-label="Account" className="flex gap-2">
            <Link href="/login" className="button-secondary" aria-current={pathname === "/login" ? "page" : undefined}>Log in</Link>
            <Link href="/register" className="button-primary" aria-current={pathname === "/register" ? "page" : undefined}>Create account</Link>
          </nav>
        ) : state.status === "error" ? (
          <Link href="/account" className="text-link">Session help</Link>
        ) : <p role="status" className="text-sm text-slate-600">Checking session…</p>}
      </div>
      {state.status === "authenticated" ? (
        <nav id="account-navigation" aria-label="Application" className={`${menuOpen ? "block" : "hidden"} border-t border-slate-100 lg:block`}>
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6 lg:flex-row lg:flex-wrap lg:gap-2">
            {getNavigationItems(state.user.role).map((item) => (
              <li key={item.label}>
                <Link href={item.href} onClick={() => setMenuOpen(false)} aria-current={pathname === item.href ? "page" : undefined}
                  className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 aria-[current=page]:bg-blue-50 aria-[current=page]:text-blue-800">{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : (
        <nav aria-label="Public" className="border-t border-slate-100">
          <ul className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 py-2 sm:px-6">
            {[{ label: "Courses", href: "/courses" }, { label: "Blog", href: "/blog" }, { label: "About", href: "/about" }].map((item) => (
              <li key={item.href}><Link href={item.href} aria-current={pathname === item.href ? "page" : undefined} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-slate-100 aria-[current=page]:bg-blue-50 aria-[current=page]:text-blue-800">{item.label}</Link></li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
