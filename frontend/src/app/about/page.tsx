import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About", description: "Learn what CPS Academy offers students and instructors." };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="max-w-3xl"><p className="section-kicker">About CPS Academy</p><h1 className="page-heading">A practical place to learn and teach.</h1><p className="page-intro">CPS Academy is a role-based learning platform where instructors prepare courses and students work through them in sequence.</p></header>
      <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200">
        <section className="grid gap-3 py-8 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10">
          <h2 className="text-2xl font-semibold tracking-tight">What CPS Academy is</h2>
          <p className="max-w-2xl leading-7 text-slate-600">A focused course platform for learning, teaching, publishing, and application oversight. Each role sees the tools and information appropriate to its work.</p>
        </section>
        <section className="grid gap-3 py-8 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10">
          <h2 className="text-2xl font-semibold tracking-tight">How learning works</h2>
          <p className="max-w-2xl leading-7 text-slate-600">Courses organize lessons in order. Enrollment protects learning material, while lesson completion and quiz history make progress visible over time.</p>
        </section>
        <section className="grid gap-3 py-8 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10">
          <h2 className="text-2xl font-semibold tracking-tight">What students can expect</h2>
          <p className="max-w-2xl leading-7 text-slate-600">A clear syllabus before enrollment, structured lessons after enrollment, saved progress, and immediate results after each quiz submission.</p>
        </section>
      </div>
      <div className="pt-9"><Link href="/courses" className="button-primary">Browse courses</Link></div>
    </div>
  );
}
