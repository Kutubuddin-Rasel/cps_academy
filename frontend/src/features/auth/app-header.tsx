"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { getNavigationItems, isNavigationItemActive } from "./navigation";

const publicNavigation = [
  { label: "Courses", href: "/courses" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];

export function AppHeader() {
  const { state, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function publicAccountActions(mobile = false) {
    const actionClass = mobile ? "w-full" : "";
    if (state.status === "unauthenticated") {
      return (
        <>
          <Link href="/login" onClick={() => setMenuOpen(false)} className={`button-secondary ${actionClass}`} aria-current={pathname === "/login" ? "page" : undefined}>Log in</Link>
          <Link href="/register" onClick={() => setMenuOpen(false)} className={`button-primary ${actionClass}`} aria-current={pathname === "/register" ? "page" : undefined}>Create account</Link>
        </>
      );
    }
    if (state.status === "error") {
      return <Link href="/account" onClick={() => setMenuOpen(false)} className={`button-tertiary ${actionClass}`}>Session help</Link>;
    }
    return <p role="status" className="text-sm text-slate-600">Checking session…</p>;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-[var(--brand-surface)]">
      <div className="mx-auto flex min-h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg font-semibold tracking-[-0.02em] text-slate-950">
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--brand-brass)] bg-[var(--brand-ink)] text-xs font-bold tracking-wide text-white">CPS</span>
          <span className="text-[1.05rem]">CPS Academy</span>
        </Link>
        {state.status === "authenticated" ? (
          <>
            <nav aria-label="Application" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {getNavigationItems(state.user.role).map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} aria-current={isNavigationItemActive(pathname, item.href) ? "page" : undefined}
                      className="navigation-link">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="hidden items-center gap-3 lg:flex">
              <Link href="/account" aria-current={pathname === "/account" ? "page" : undefined}
                aria-label="Open account"
                className="flex min-h-11 max-w-48 items-center rounded-lg px-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-[var(--brand-teal-soft)] hover:text-[var(--brand-ink)] aria-[current=page]:bg-[var(--brand-teal-soft)] aria-[current=page]:text-[var(--brand-ink)] motion-reduce:transition-none">
                <span className="truncate">{state.user.username}</span>
              </Link>
              <span aria-hidden="true" className="h-6 w-px bg-slate-200" />
              <button type="button" className="utility-action" onClick={() => { setMenuOpen(false); logout(); }}>Log out</button>
            </div>
            <button type="button" className="button-secondary lg:hidden" aria-expanded={menuOpen} aria-controls="account-navigation"
              onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? "Close menu" : "Menu"}</button>
          </>
        ) : (
          <>
            <nav aria-label="Public" className="hidden md:block">
              <ul className="flex items-center gap-1">
                {publicNavigation.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={isNavigationItemActive(pathname, item.href) ? "page" : undefined}
                      className="navigation-link">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Account" className="hidden items-center gap-2 md:flex">
              {publicAccountActions()}
            </nav>
            <button type="button" className="button-secondary md:hidden" aria-expanded={menuOpen} aria-controls="public-navigation"
              onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? "Close menu" : "Menu"}</button>
          </>
        )}
      </div>
      {state.status === "authenticated" && menuOpen ? (
        <div id="account-navigation" className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:hidden">
          <nav aria-label="Application">
            <ul className="space-y-1">
              {getNavigationItems(state.user.role).map((item) => (
                <li key={item.label}>
                  <Link href={item.href} onClick={() => setMenuOpen(false)} aria-current={isNavigationItemActive(pathname, item.href) ? "page" : undefined}
                    className="mobile-navigation-link">{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-3 border-t border-slate-200 pt-4">
            <Link href="/account" onClick={() => setMenuOpen(false)} aria-current={pathname === "/account" ? "page" : undefined}
              aria-label="Open account"
              className="mobile-navigation-link font-semibold">
              <span className="truncate">{state.user.username}</span>
            </Link>
            <button type="button" className="utility-action mt-2 w-full justify-start px-3" onClick={() => { setMenuOpen(false); logout(); }}>Log out</button>
          </div>
        </div>
      ) : menuOpen ? (
        <div id="public-navigation" className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <nav aria-label="Public">
            <ul className="space-y-1">
              {publicNavigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setMenuOpen(false)} aria-current={isNavigationItemActive(pathname, item.href) ? "page" : undefined}
                    className="mobile-navigation-link">{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Account" className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-4">
            {publicAccountActions(true)}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
