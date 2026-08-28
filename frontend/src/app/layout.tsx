import type { Metadata } from "next";
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
          <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
            {children}
          </main>
        </AuthProvider>
        <footer className="border-t border-slate-200 px-4 py-5 text-center text-sm text-slate-600">CPS Academy · Learn at your own pace</footer>
      </body>
    </html>
  );
}
