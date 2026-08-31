import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { AppHeader } from "@/features/auth/app-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CPS Academy", template: "%s | CPS Academy" },
  description: "Learn, teach, and manage courses with CPS Academy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-white focus:p-4">Skip to content</a>
        <AuthProvider>
          <AppHeader />
          <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
            {children}
          </main>
        </AuthProvider>
        <footer className="border-t border-stone-200 bg-[var(--brand-surface)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--brand-brass)] bg-[var(--brand-ink)] text-[0.65rem] font-bold tracking-wide text-white">CPS</span>
              <p><span className="block font-semibold text-slate-950">CPS Academy</span><span className="mt-0.5 block">Structured learning, visible progress</span></p>
            </div>
            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                <li><Link href="/courses" className="inline-flex min-h-11 items-center font-medium text-slate-700 transition-colors hover:text-[var(--brand-teal)] motion-reduce:transition-none">Courses</Link></li>
                <li><Link href="/blog" className="inline-flex min-h-11 items-center font-medium text-slate-700 transition-colors hover:text-[var(--brand-teal)] motion-reduce:transition-none">Blog</Link></li>
                <li><Link href="/about" className="inline-flex min-h-11 items-center font-medium text-slate-700 transition-colors hover:text-[var(--brand-teal)] motion-reduce:transition-none">About</Link></li>
              </ul>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
