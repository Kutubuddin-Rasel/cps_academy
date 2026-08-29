import Link from "next/link";
import { LandingActions } from "@/features/auth/landing-actions";
import { getPublishedPosts } from "@/features/blog/api";
import { BlogCard } from "@/features/blog/blog-card";
import { getPublicCourses } from "@/features/courses/api";
import { CourseCard } from "@/features/courses/course-card";

export default async function Home() {
  const [courseResult, blogResult] = await Promise.allSettled([
    getPublicCourses(new AbortController().signal),
    getPublishedPosts(new AbortController().signal),
  ]);
  const courses = courseResult.status === "fulfilled" ? courseResult.value.slice(0, 3) : [];
  const posts = blogResult.status === "fulfilled" ? blogResult.value.slice(0, 3) : [];

  return (
    <div className="space-y-24 pb-8 sm:space-y-28">
      <section className="grid gap-10 py-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-center lg:py-14">
        <div>
          <p className="section-kicker">Structured learning, visible progress</p>
          <h1 className="font-display mt-5 max-w-4xl text-5xl font-bold leading-[1.03] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">From first lesson to finished course.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">CPS Academy brings instructor-built lessons, progress tracking, and instant quiz feedback into one focused learning path.</p>
          <LandingActions />
        </div>
        <div className="relative rounded-3xl border border-sky-200 bg-sky-50 p-6 sm:p-8" aria-label="A structured learning path">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">Your path</p>
          <ol className="learning-path mt-6">
            {["Choose a course", "Learn in sequence", "Check your progress", "Test your knowledge"].map((label, index) => (
              <li key={label} className="learning-path-item"><span className="learning-path-node" aria-hidden="true">{index + 1}</span><div className="rounded-xl border border-white bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm">{label}</div></li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="featured-courses">
        <div className="section-heading-row"><div><p className="section-kicker">Discover</p><h2 id="featured-courses" className="section-heading">Featured courses</h2></div><Link href="/courses" className="text-link">View all courses →</Link></div>
        {courses.length ? <ul className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <li key={course.documentId}><CourseCard course={course} compact /></li>)}</ul>
          : <p className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Course discovery is temporarily unavailable. Visit the catalog to try again.</p>}
      </section>

      <section aria-labelledby="why-cps">
        <p className="section-kicker">Built for steady progress</p><h2 id="why-cps" className="section-heading">Why CPS Academy</h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-3">
          {[{ title: "Structured learning", text: "Follow lessons in a clear instructor-designed sequence." }, { title: "Progress that persists", text: "Return knowing exactly what you completed and what comes next." }, { title: "Instant quiz feedback", text: "Submit answers and receive an authoritative result immediately." }].map((benefit) => (
            <article key={benefit.title} className="bg-white p-7"><h3 className="text-xl font-semibold">{benefit.title}</h3><p className="mt-3 leading-7 text-slate-600">{benefit.text}</p></article>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-posts">
        <div className="section-heading-row"><div><p className="section-kicker">From the academy</p><h2 id="recent-posts" className="section-heading">Recent Blog posts</h2></div><Link href="/blog" className="text-link">Visit the Blog →</Link></div>
        {posts.length ? <ul className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{posts.map((post) => <li key={post.documentId}><BlogCard post={post} compact /></li>)}</ul>
          : <p className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">No published posts yet. Check back for academy updates.</p>}
      </section>

      <section className="rounded-3xl bg-slate-950 px-6 py-10 text-white sm:px-10 sm:py-12 md:flex md:items-center md:justify-between md:gap-10">
        <div><p className="text-sm font-semibold uppercase tracking-widest text-sky-300">Start with the catalog</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">See where your next lesson leads.</h2></div><Link href="/courses" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-3 font-semibold text-slate-950 hover:bg-sky-50 md:mt-0">Explore courses</Link>
      </section>
    </div>
  );
}
