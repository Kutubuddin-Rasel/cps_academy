import type { Metadata } from "next";
import { getPublishedPosts } from "@/features/blog/api";
import { BlogLatestStory, BlogStoryCard } from "@/features/blog/blog-card";
import { requestErrorMessage } from "@/lib/api/error";
import type { BlogPost } from "@/features/blog/types";

export const metadata: Metadata = { title: "Blog", description: "Published news and learning notes from CPS Academy." };

export default async function BlogPage() {
  let posts: BlogPost[] = [];
  let errorMessage: string | null = null;
  try {
    posts = await getPublishedPosts(new AbortController().signal);
  } catch (error: unknown) {
    errorMessage = requestErrorMessage(error);
  }
  if (errorMessage) return <section className="rounded-xl border border-red-200 border-l-4 border-l-red-700 bg-red-50 px-5 py-5 sm:px-6"><h1 className="text-2xl font-semibold text-slate-950">Blog unavailable</h1><p role="alert" className="mt-3 text-red-800">{errorMessage}</p></section>;
  const [leadPost, ...remainingPosts] = posts;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="max-w-3xl border-l-4 border-[var(--brand-brass)] pl-5 sm:pl-7">
        <p className="section-kicker">CPS Academy Blog</p>
        <h1 className="page-heading">Ideas on learning and building.</h1>
        <p className="page-intro">Updates about courses, teaching, and learning across CPS Academy.</p>
      </header>
      {!leadPost ? (
        <div className="mt-12 rounded-xl border border-slate-200 bg-white px-6 py-8">
          <h2 className="text-xl font-semibold text-slate-950">No published posts yet</h2>
          <p className="mt-2 text-slate-600">Published updates will appear here.</p>
        </div>
      ) : (
        <div className="mt-12">
          <BlogLatestStory post={leadPost} headingLevel={2} />
          {remainingPosts.length ? (
            <section aria-labelledby="more-articles-heading" className="mt-14">
              <h2 id="more-articles-heading" className="section-kicker text-slate-500">More articles</h2>
              <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {remainingPosts.map((post) => <li key={post.documentId} className="min-w-0"><BlogStoryCard post={post} headingLevel={3} /></li>)}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
