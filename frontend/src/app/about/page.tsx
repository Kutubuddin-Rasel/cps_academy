import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About", description: "Learn what CPS Academy offers students and instructors." };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <header><p className="section-kicker">About CPS Academy</p><h1 className="page-heading">A clear path for learning and teaching.</h1><p className="page-intro">CPS Academy is a role-based learning platform where instructors shape courses and students move through them with confidence.</p></header>
      <section className="grid gap-6 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-7"><h2 className="text-2xl font-semibold">Learning with structure</h2><p className="mt-4 leading-7 text-slate-600">Courses organize lessons in sequence. Enrollment protects learning material, while completion and quiz history make progress visible over time.</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-7"><h2 className="text-2xl font-semibold">Teaching with purpose</h2><p className="mt-4 leading-7 text-slate-600">Instructors create lessons and quizzes for courses they own. Content Managers and Admins support publishing, course operations, and platform oversight.</p></article>
      </section>
      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-7"><h2 className="text-2xl font-semibold">One platform, four clear roles</h2><p className="mt-4 leading-7 text-slate-600">Students learn, Instructors teach, Content Managers coordinate content, and Admins manage the application. Backend authorization keeps every responsibility separate.</p><Link href="/courses" className="button-primary mt-6">Explore courses</Link></section>
    </div>
  );
}
