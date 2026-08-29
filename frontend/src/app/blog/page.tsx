import type { Metadata } from "next";
import { getPublishedPosts } from "@/features/blog/api";
import { BlogCard } from "@/features/blog/blog-card";
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
  if (errorMessage) return <section className="rounded-2xl border border-red-200 bg-white p-6"><h1 className="text-2xl font-semibold">Blog unavailable</h1><p role="alert" className="mt-3 text-red-800">{errorMessage}</p></section>;
  return (
    <div className="space-y-10">
      <header className="max-w-3xl"><p className="section-kicker">Academy notes</p><h1 className="page-heading">CPS Academy Blog</h1><p className="page-intro">Published updates about structured learning, teaching, and progress across the academy.</p></header>
      {posts.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-6">No published posts yet.</p> : <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{posts.map((post) => <li key={post.documentId}><BlogCard post={post} /></li>)}</ul>}
    </div>
  );
}
