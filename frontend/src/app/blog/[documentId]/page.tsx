import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPost } from "@/features/blog/api";
import { BlocksRenderer } from "@/features/blog/blocks";
import { BlogCover } from "@/features/blog/blog-cover";
import { formattedBlogDate } from "@/features/blog/blog-card";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import type { BlogPost } from "@/features/blog/types";

export const metadata: Metadata = { title: "Blog post" };

export default async function BlogDetailPage({ params }: PageProps<"/blog/[documentId]">) {
  const { documentId } = await params;
  let post: BlogPost | null = null;
  let errorMessage: string | null = null;
  try {
    post = await getPublishedPost(documentId, new AbortController().signal);
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 404) notFound();
    errorMessage = requestErrorMessage(error);
  }
  if (errorMessage) return <section className="border-l-2 border-red-700 bg-red-50 px-5 py-4"><h1 className="text-2xl font-semibold">Post unavailable</h1><p role="alert" className="mt-3 text-red-800">{errorMessage}</p></section>;
  if (!post) notFound();
  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/blog" className="text-link inline-flex min-h-11 items-center">← Back to Blog</Link>
      <header className="mt-5"><p className="text-sm text-slate-500">{formattedBlogDate(post.publishedAt)}</p><h1 className="page-heading">{post.title}</h1></header>
      <BlogCover coverUrl={post.coverUrl} title={post.title} className="mt-8 max-h-[28rem] w-full rounded-xl object-cover" />
      <div className="mt-9 border-t border-slate-200 pt-8"><BlocksRenderer content={post.content} /></div>
    </article>
  );
}
