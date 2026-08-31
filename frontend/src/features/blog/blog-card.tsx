import Link from "next/link";
import { BlogCover, safeBlogCoverUrl } from "./blog-cover";
import { blogExcerpt } from "./content";
import type { BlogPost } from "./types";

export function formattedBlogDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "Draft";
}

interface BlogStoryProps {
  post: BlogPost;
  headingLevel: 2 | 3;
}

export function BlogLatestStory({ post, headingLevel }: BlogStoryProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const href = `/blog/${encodeURIComponent(post.documentId)}`;
  const hasCover = safeBlogCoverUrl(post.coverUrl) !== null;

  return (
    <article className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${hasCover ? "lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
      <div className="flex min-w-0 flex-col px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-11">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="rounded-full bg-[var(--brand-brass-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-brass)]">Latest</span>
          <time dateTime={post.publishedAt ?? undefined} className="text-sm text-slate-500">{formattedBlogDate(post.publishedAt)}</time>
        </div>
        <Heading className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-slate-950 sm:text-4xl">
          <Link href={href} className="transition-colors hover:text-[var(--brand-teal)] motion-reduce:transition-none">{post.title}</Link>
        </Heading>
        <p className="mt-5 line-clamp-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{blogExcerpt(post.content) || "Read the latest from CPS Academy."}</p>
        <Link href={href} className="mt-6 inline-flex min-h-11 w-fit items-center text-sm font-semibold text-[var(--brand-teal)] transition-colors hover:text-[var(--brand-ink)] motion-reduce:transition-none">
          Read article <span aria-hidden="true" className="ml-1.5">→</span>
        </Link>
      </div>
      {hasCover ? (
        <div className="border-t border-slate-200 bg-slate-100 lg:border-l lg:border-t-0">
          <BlogCover
            coverUrl={post.coverUrl}
            title={post.title}
            className="aspect-[16/10] h-full w-full object-cover"
            sizes="(max-width: 1024px) 100vw, 352px"
          />
        </div>
      ) : null}
    </article>
  );
}

export function BlogStoryCard({ post, headingLevel }: BlogStoryProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const href = `/blog/${encodeURIComponent(post.documentId)}`;
  const hasCover = safeBlogCoverUrl(post.coverUrl) !== null;

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-stone-200 border-t-[var(--brand-teal)] bg-[var(--brand-surface)] shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md motion-reduce:transition-none">
      {hasCover ? (
        <div className="overflow-hidden border-b border-slate-200 bg-slate-100">
          <BlogCover
            coverUrl={post.coverUrl}
            title={post.title}
            className="aspect-[16/9] w-full object-cover transition-transform duration-300 hover:scale-[1.02] motion-reduce:transition-none"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-6">
        <time dateTime={post.publishedAt ?? undefined} className="text-sm text-slate-500">{formattedBlogDate(post.publishedAt)}</time>
        <Heading className="mt-3 text-xl font-semibold leading-snug tracking-[-0.02em] text-slate-950">
          <Link href={href} className="transition-colors hover:text-[var(--brand-teal)] motion-reduce:transition-none">{post.title}</Link>
        </Heading>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{blogExcerpt(post.content) || "Read this update from CPS Academy."}</p>
        <Link href={href} className="mt-5 inline-flex min-h-11 w-fit items-center text-sm font-semibold text-[var(--brand-teal)] transition-colors hover:text-[var(--brand-ink)] motion-reduce:transition-none">
          Read article <span aria-hidden="true" className="ml-1.5">→</span>
        </Link>
      </div>
    </article>
  );
}

export function BlogLeadStory({ post, headingLevel }: BlogStoryProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const href = `/blog/${encodeURIComponent(post.documentId)}`;

  return (
    <article className="min-w-0">
      <time dateTime={post.publishedAt ?? undefined} className="text-sm text-slate-500">{formattedBlogDate(post.publishedAt)}</time>
      <Heading className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.025em] text-slate-950">
        <Link href={href} className="inline-flex min-h-11 items-center transition-colors hover:text-[var(--brand-teal)] motion-reduce:transition-none">{post.title}</Link>
      </Heading>
      <p className="mt-5 line-clamp-4 max-w-2xl [overflow-wrap:normal] text-lg leading-8 text-slate-600">{blogExcerpt(post.content) || "Read the latest from CPS Academy."}</p>
      <Link href={href} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-teal)] hover:text-[var(--brand-ink)]">Read article <span aria-hidden="true" className="ml-1">→</span></Link>
    </article>
  );
}

export function BlogStoryRow({ post, headingLevel }: BlogStoryProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const href = `/blog/${encodeURIComponent(post.documentId)}`;

  return (
    <article className="grid min-w-0 gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
      <Heading className="text-lg font-semibold tracking-tight text-slate-950">
        <Link href={href} className="inline-flex min-h-11 items-center transition-colors hover:text-[var(--brand-teal)] motion-reduce:transition-none">{post.title}<span aria-hidden="true" className="ml-2 text-sm font-normal text-[var(--brand-teal)]">→</span></Link>
      </Heading>
      <time dateTime={post.publishedAt ?? undefined} className="text-sm text-slate-500 sm:text-right">{formattedBlogDate(post.publishedAt)}</time>
    </article>
  );
}
