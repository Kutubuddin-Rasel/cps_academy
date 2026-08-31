import Link from "next/link";
import { LandingActions } from "@/features/auth/landing-actions";
import { getPublishedPosts } from "@/features/blog/api";
import { BlogLeadStory, BlogStoryRow } from "@/features/blog/blog-card";
import { getPublicCourses } from "@/features/courses/api";
import { LandingCoursePreview } from "@/features/courses/landing-course-preview";
import { publicCourseGridClassName, shouldShowAllCoursesLink } from "@/features/courses/public-course-layout";

const learningSteps = [
  { number: "01", title: "Enroll", text: "Choose a course and join when you are ready." },
  { number: "02", title: "Learn in sequence", text: "Work through instructor-built lessons in order." },
  { number: "03", title: "Track your progress", text: "Return to completed lessons and recorded quiz attempts." },
] as const;

const benefits = [
  { title: "Structured learning", text: "Follow lessons in a clear instructor-designed sequence." },
  { title: "Progress that persists", text: "Return knowing exactly what you completed and what comes next." },
  { title: "Instant quiz feedback", text: "Submit answers and receive an authoritative result immediately." },
] as const;

export default async function Home() {
  const [courseResult, blogResult] = await Promise.allSettled([
    getPublicCourses(new AbortController().signal),
    getPublishedPosts(new AbortController().signal),
  ]);
  const allCourses = courseResult.status === "fulfilled" ? courseResult.value : [];
  const courses = allCourses.slice(0, 4);
  const posts = blogResult.status === "fulfilled" ? blogResult.value.slice(0, 4) : [];
  const heroCourse = courses[0];
  const [leadPost, ...secondaryPosts] = posts;

  return (
    <div className="-my-8 sm:-my-12">
      <section className="relative py-12 sm:py-16 lg:py-20">
        <div className={`grid items-center gap-12 ${heroCourse ? "lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.72fr)] lg:gap-16" : "max-w-4xl"}`}>
          <div>
            <p className="section-kicker">Structured online learning</p>
            <h1 className="page-heading max-w-[18ch] text-pretty lg:text-[3.5rem] lg:leading-[1.08]">
              Learn with direction. <span className="text-[var(--brand-teal)]">Make progress that lasts.</span>
            </h1>
            <p className="page-intro">Choose an instructor-built course, work through each lesson in sequence, and return knowing exactly what comes next.</p>
            <LandingActions />
          </div>

          {heroCourse ? (
            <aside aria-label="Course preview" className="relative rounded-2xl border border-[var(--brand-brass-soft)] bg-[var(--brand-surface)] p-4 shadow-[0_20px_50px_rgba(25,55,64,0.10)] sm:p-6">
              <div aria-hidden="true" className="absolute -left-3 top-10 h-24 w-1 rounded-full bg-[var(--brand-brass)]" />
              <div className="rounded-xl border border-stone-200 bg-[#f8f6f0] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="section-kicker">Course preview</p>
                  <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-ink)] text-sm font-bold text-white">C</span>
                </div>
                <h2 className="mt-5 [overflow-wrap:anywhere] text-2xl font-semibold tracking-[-0.03em] text-slate-950">{heroCourse.title}</h2>
                {heroCourse.instructor ? <p className="mt-3 text-sm text-slate-600"><span className="font-medium text-slate-800">Instructor</span> · {heroCourse.instructor.username}</p> : null}
                <p className="mt-5 line-clamp-3 [overflow-wrap:anywhere] leading-7 text-slate-600">{heroCourse.description || "Course details are being prepared."}</p>
                <Link href={`/courses/${encodeURIComponent(heroCourse.documentId)}`} className="button-secondary mt-6 w-full">Explore this course <span aria-hidden="true" className="ml-1">→</span></Link>
              </div>
            </aside>
          ) : null}
        </div>
      </section>

      <section id="how-learning-works" aria-labelledby="learning-works" className="scroll-mt-28 border-t border-slate-200 py-14 sm:py-16">
        <div className="max-w-2xl">
          <p className="section-kicker">A clear learning path</p>
          <h2 id="learning-works" className="section-heading">How learning works</h2>
          <p className="mt-4 leading-7 text-slate-600">From enrollment to review, every step is designed to keep the next action clear.</p>
        </div>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {learningSteps.map((step) => (
            <li key={step.number} className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 after:absolute after:left-[1.35rem] after:top-6 after:h-[calc(100%+2rem)] after:w-px after:bg-[var(--brand-brass-soft)] after:content-[''] last:after:hidden md:block md:after:h-px md:after:w-[calc(100%+2.5rem)]">
              <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--brand-brass-soft)] bg-[var(--brand-surface)] text-xs font-semibold tabular-nums text-[var(--brand-brass)] shadow-sm">{step.number}</span>
              <div className="pb-2 md:mt-5 md:pb-0">
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">{step.title}</h3>
                <p className="mt-2 max-w-sm leading-7 text-slate-600">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="featured-courses" className="relative left-1/2 w-dvw -translate-x-1/2 border-y border-stone-200 bg-[#e9eeea]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="section-heading-row">
            <div>
              <p className="section-kicker">Learn at your pace</p>
              <h2 id="featured-courses" className="section-heading">Courses to explore</h2>
            </div>
            <p className="max-w-md leading-7 text-slate-600">Review each course and its public syllabus before choosing where to begin.</p>
          </div>
          {courses.length ? (
            <>
              <ul className={`mt-10 ${publicCourseGridClassName(courses.length)}`}>
                {courses.map((course) => <li key={course.documentId}><LandingCoursePreview course={course} /></li>)}
              </ul>
              {shouldShowAllCoursesLink(allCourses.length) ? (
                <Link href="/courses" className="text-link mt-7 inline-flex min-h-11 items-center">View all courses <span aria-hidden="true" className="ml-1">→</span></Link>
              ) : null}
            </>
          ) : (
            <div className="mt-8 border-l-2 border-[var(--brand-teal)] pl-5"><p className="text-slate-600">Course discovery is temporarily unavailable.</p><Link href="/courses" className="text-link mt-2 inline-flex min-h-11 items-center">Visit the course catalog</Link></div>
          )}
        </div>
      </section>

      <section aria-labelledby="why-cps" className="grid gap-8 py-14 sm:py-16 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
        <div><p className="section-kicker">Built for focus</p><h2 id="why-cps" className="section-heading">Why CPS Academy</h2></div>
        <div className="max-w-3xl divide-y divide-slate-200 border-y border-slate-200">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="grid gap-2 py-7 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8">
              <h3 className="text-lg font-semibold text-slate-950">{benefit.title}</h3>
              <p className="leading-7 text-slate-600">{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-posts" className="border-t border-slate-200 py-14 sm:py-16">
        <div className="section-heading-row">
          <div><p className="section-kicker">Ideas and updates</p><h2 id="recent-posts" className="section-heading">From the Blog</h2></div>
          <Link href="/blog" className="text-link inline-flex min-h-11 items-center">View all articles <span aria-hidden="true" className="ml-1">→</span></Link>
        </div>
        {leadPost ? (
          <div className={`mt-10 ${secondaryPosts.length ? "grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:gap-14" : "max-w-3xl"}`}>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><BlogLeadStory post={leadPost} headingLevel={3} /></div>
            {secondaryPosts.length ? (
              <div>
                <ul className="divide-y divide-slate-200 border-y border-slate-200">
                  {secondaryPosts.map((post) => <li key={post.documentId}><BlogStoryRow post={post} headingLevel={3} /></li>)}
                </ul>
              </div>
            ) : null}
          </div>
        ) : <p className="mt-8 border-l-2 border-slate-300 pl-5 text-slate-600">No published posts yet. Check back for academy updates.</p>}
      </section>

      <section className="relative left-1/2 w-dvw -translate-x-1/2 bg-[var(--brand-ink)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <div className="mx-auto grid max-w-4xl gap-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d9b879]">Your next course</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Ready to start learning?</h2><p className="mt-3 text-[#dce8e5]">Review the catalog and public syllabus before you enroll.</p></div>
            <Link href="/courses" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--brand-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-teal-dark)] shadow-sm transition-colors hover:bg-[var(--brand-brass-soft)] active:bg-white motion-reduce:transition-none">Browse courses</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
