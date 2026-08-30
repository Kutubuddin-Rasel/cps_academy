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
  const [leadPost, ...secondaryPosts] = posts;

  return (
    <div className="-my-8 sm:-my-12">
      <section className="pb-10 pt-12 sm:pt-12">
        <h1 className="page-heading mt-0 max-w-[24ch] text-pretty">Learn through structured courses, one lesson at a time.</h1>
        <p className="page-intro">Enroll in a course, complete lessons in sequence, and keep your progress and quiz attempts in one place.</p>
        <LandingActions />
      </section>

      <section id="how-learning-works" aria-labelledby="learning-works">
        <h2 id="learning-works" className="section-heading mt-0">How learning works</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
          {learningSteps.map((step) => (
            <li key={step.number} className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 after:absolute after:left-5 after:top-5 after:h-[calc(100%+2rem)] after:w-px after:bg-blue-200 after:content-[''] last:after:hidden md:block md:after:h-px md:after:w-[calc(100%+2.5rem)]">
              <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-blue-300 bg-slate-50 text-xs font-semibold tabular-nums text-blue-800">{step.number}</span>
              <div className="pb-2 md:mt-5 md:pb-0">
                <h3 className="font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-2 max-w-sm leading-7 text-slate-600">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="featured-courses" className="relative left-1/2 w-dvw -translate-x-1/2 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 id="featured-courses" className="section-heading mt-0">Featured courses</h2>
          {courses.length ? (
            <>
              <ul className={`mt-8 ${publicCourseGridClassName(courses.length)}`}>
                {courses.map((course) => <li key={course.documentId}><LandingCoursePreview course={course} /></li>)}
              </ul>
              {shouldShowAllCoursesLink(allCourses.length) ? (
                <Link href="/courses" className="text-link mt-6 inline-flex min-h-11 items-center">View all Courses <span aria-hidden="true" className="ml-1">→</span></Link>
              ) : null}
            </>
          ) : (
            <div className="mt-8 border-l-2 border-blue-700 pl-5"><p className="text-slate-600">Course discovery is temporarily unavailable.</p><Link href="/courses" className="text-link mt-2 inline-flex min-h-11 items-center">Visit the course catalog</Link></div>
          )}
        </div>
      </section>

      <section aria-labelledby="why-cps" className="grid gap-8 pb-14 pt-0 sm:pb-16 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
        <h2 id="why-cps" className="section-heading mt-0">Why CPS Academy</h2>
        <div className="max-w-3xl divide-y divide-slate-200 border-y border-slate-200">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="grid gap-2 py-6 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8">
              <h3 className="text-lg font-semibold text-slate-950">{benefit.title}</h3>
              <p className="leading-7 text-slate-600">{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-posts" className="pb-4">
        <h2 id="recent-posts" className="section-heading mt-0">From the Blog</h2>
        {leadPost ? (
          <div className={`mt-8 ${secondaryPosts.length ? "grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:gap-14" : "max-w-3xl"}`}>
            <div className="border-y border-slate-300 py-8"><BlogLeadStory post={leadPost} headingLevel={3} /></div>
            {secondaryPosts.length ? (
              <div>
                <ul className="divide-y divide-slate-200 border-y border-slate-200">
                  {secondaryPosts.map((post) => <li key={post.documentId}><BlogStoryRow post={post} headingLevel={3} /></li>)}
                </ul>
                <Link href="/blog" className="text-link mt-5 inline-flex min-h-11 items-center">View all articles <span aria-hidden="true" className="ml-1">→</span></Link>
              </div>
            ) : null}
          </div>
        ) : <p className="mt-8 border-l-2 border-slate-300 pl-5 text-slate-600">No published posts yet. Check back for academy updates.</p>}
      </section>

      <section className="relative left-1/2 w-dvw -translate-x-1/2 border-y border-blue-100 bg-blue-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div><h2 className="text-2xl font-semibold tracking-tight text-slate-950">Ready to choose a course?</h2><p className="mt-2 text-slate-600">Review the catalog and syllabus before you enroll.</p></div>
            <Link href="/courses" className="button-primary">Browse courses</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
