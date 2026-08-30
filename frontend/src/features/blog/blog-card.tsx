import Link from "next/link";
import { blogExcerpt } from "./content";
import type { BlogPost } from "./types";

export function formattedBlogDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "Draft";
}

interface BlogStoryProps {
  post: BlogPost;
  headingLevel: 2 | 3;
}

export function BlogLeadStory({ post, headingLevel }: BlogStoryProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const href = `/blog/${encodeURIComponent(post.documentId)}`;

  return (
    <article className="min-w-0">
      <time dateTime={post.publishedAt ?? undefined} className="text-sm text-slate-500">{formattedBlogDate(post.publishedAt)}</time>
      <Heading className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.025em] text-slate-950">
        <Link href={href} className="inline-flex min-h-11 items-center transition-colors hover:text-blue-800 motion-reduce:transition-none">{post.title}</Link>
      </Heading>
      <p className="mt-5 line-clamp-4 max-w-2xl [overflow-wrap:normal] text-lg leading-8 text-slate-600">{blogExcerpt(post.content) || "Read the latest from CPS Academy."}</p>
      <Link href={href} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 hover:text-blue-900">Read article <span aria-hidden="true" className="ml-1">→</span></Link>
    </article>
  );
}

export function BlogStoryRow({ post, headingLevel }: BlogStoryProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const href = `/blog/${encodeURIComponent(post.documentId)}`;

  return (
    <article className="grid min-w-0 gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
      <Heading className="text-lg font-semibold tracking-tight text-slate-950">
        <Link href={href} className="inline-flex min-h-11 items-center transition-colors hover:text-blue-800 motion-reduce:transition-none">{post.title}<span aria-hidden="true" className="ml-2 text-sm font-normal text-blue-700">→</span></Link>
      </Heading>
      <time dateTime={post.publishedAt ?? undefined} className="text-sm text-slate-500 sm:text-right">{formattedBlogDate(post.publishedAt)}</time>
    </article>
  );
}
