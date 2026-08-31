import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About", description: "Learn what CPS Academy offers students and instructors." };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-slate-200 pb-12 pt-2 sm:pb-16 sm:pt-8">
        <p className="section-kicker">About CPS Academy</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-6xl">
          A practical place to <span className="text-[var(--brand-teal)]">learn and teach.</span>
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">CPS Academy is a role-based learning platform where instructors prepare courses and students work through them in sequence.</p>
      </header>
      <div className="divide-y divide-slate-200 border-b border-slate-200">
        <section className="grid gap-4 border-l-2 border-[var(--brand-brass-soft)] py-9 pl-5 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12 md:py-11 md:pl-7">
          <h2 className="text-2xl font-semibold tracking-tight">What CPS Academy is</h2>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">A focused course platform for learning, teaching, publishing, and application oversight. Each role sees the tools and information appropriate to its work.</p>
        </section>
        <section className="grid gap-4 border-l-2 border-[#bfd6d1] py-9 pl-5 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12 md:py-11 md:pl-7">
          <h2 className="text-2xl font-semibold tracking-tight">How learning works</h2>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">Courses organize lessons in order. Enrollment protects learning material, while lesson completion and quiz history make progress visible over time.</p>
        </section>
        <section className="grid gap-4 border-l-2 border-[#d3b987] py-9 pl-5 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-12 md:py-11 md:pl-7">
          <h2 className="text-2xl font-semibold tracking-tight">What students can expect</h2>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">A clear syllabus before enrollment, structured lessons after enrollment, saved progress, and immediate results after each quiz submission.</p>
        </section>
      </div>
      <section className="mt-12 flex flex-col gap-6 rounded-2xl bg-[var(--brand-ink)] px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between sm:px-9 sm:py-9">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Ready to start learning?</h2>
          <p className="mt-2 max-w-2xl leading-7 text-[#dce8e5]">Browse the course catalog and preview each syllabus before you enroll.</p>
        </div>
        <Link href="/courses" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-teal-dark)] transition-colors hover:bg-[var(--brand-brass-soft)] active:bg-white motion-reduce:transition-none">Browse courses</Link>
      </section>
    </div>
  );
}
