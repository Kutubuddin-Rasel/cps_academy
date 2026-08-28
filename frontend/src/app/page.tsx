import Link from "next/link";

export default function Home() {
  return (
    <section className="max-w-3xl py-8 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">CPS Academy</p>
      <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-5xl">Learn, teach, and manage courses in one place.</h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">A focused space for students, instructors, and the people who support them. Start by creating your account or logging in.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/register" className="button-primary">Create an account</Link>
        <Link href="/login" className="button-secondary">Log in</Link>
      </div>
      <p className="mt-10 max-w-lg text-sm leading-6 text-slate-600">Account access is ready. Learning, quizzes, and content management are coming in the next releases.</p>
    </section>
  );
}
