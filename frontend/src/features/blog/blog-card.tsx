import Link from "next/link";
import { blogExcerpt } from "./content";
import { BlogCover } from "./blog-cover";
import type { BlogPost } from "./types";

export function formattedBlogDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "Draft";
}

export function BlogCard({ post, compact = false }: { post: BlogPost; compact?: boolean }) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <BlogCover coverUrl={post.coverUrl} title={post.title} className={`${compact ? "h-36" : "h-48"} w-full object-cover`} />
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{formattedBlogDate(post.publishedAt)}</p>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{post.title}</h2>
        <p className="mt-4 leading-7 text-slate-600">{blogExcerpt(post.content) || "Read the latest from CPS Academy."}</p>
        <div className="mt-auto pt-6"><Link href={`/blog/${encodeURIComponent(post.documentId)}`} className="text-link">Read article →</Link></div>
      </div>
    </article>
  );
}
