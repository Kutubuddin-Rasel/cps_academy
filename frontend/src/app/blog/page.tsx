import type { Metadata } from "next";
import { getPublishedPosts } from "@/features/blog/api";
import { BlogLeadStory, BlogStoryRow } from "@/features/blog/blog-card";
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
  if (errorMessage) return <section className="border-l-2 border-red-700 bg-red-50 px-5 py-4"><h1 className="text-2xl font-semibold">Blog unavailable</h1><p role="alert" className="mt-3 text-red-800">{errorMessage}</p></section>;
  const [leadPost, ...remainingPosts] = posts;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="max-w-2xl"><h1 className="page-heading mt-0">Blog</h1><p className="page-intro">Updates about courses, teaching, and learning across CPS Academy.</p></header>
      {!leadPost ? <p className="mt-9 border-l-2 border-slate-300 pl-5 text-slate-600">No published posts yet.</p> : (
        <div className="mt-10">
          <div className="border-y border-slate-300 py-8 sm:py-10"><BlogLeadStory post={leadPost} headingLevel={2} /></div>
          {remainingPosts.length ? (
            <ul className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
              {remainingPosts.map((post) => <li key={post.documentId}><BlogStoryRow post={post} headingLevel={2} /></li>)}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
