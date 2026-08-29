"use client";

import { useState } from "react";
import { requestErrorMessage } from "@/lib/api/error";
import { blocksToBody } from "./content";
import { createBlogPost, updateBlogPost } from "./api";
import type { BlogEditorInput, ManagedBlogPost } from "./types";

interface BlogEditorProps {
  post: ManagedBlogPost | null;
  token: string;
  onSaved: (message: string) => void;
  onCancel: () => void;
}

export function BlogEditor({ post, token, onSaved, onCancel }: BlogEditorProps) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post ? blocksToBody(post.content) : "");
  const [coverUrl, setCoverUrl] = useState(post?.coverUrl ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !body.trim() || submitting) return;
    const input: BlogEditorInput = { title, body, coverUrl };
    const controller = new AbortController();
    setSubmitting(true);
    setError(null);
    try {
      if (post) await updateBlogPost(post.documentId, input, token, controller.signal);
      else await createBlogPost(input, token, controller.signal);
      onSaved(post ? "Draft changes saved." : "Draft created.");
    } catch (failure: unknown) {
      setError(requestErrorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8" aria-labelledby="blog-editor-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="section-kicker">{post ? "Edit draft" : "New draft"}</p><h2 id="blog-editor-heading" className="mt-2 text-2xl font-semibold">{post ? post.title : "Create a Blog post"}</h2></div>
        {post ? <button type="button" className="button-secondary" onClick={onCancel}>Cancel edit</button> : null}
      </div>
      <form className="mt-7 space-y-5" onSubmit={(event) => { void submit(event); }}>
        <div><label className="field-label" htmlFor="blog-title">Title</label><input id="blog-title" className="field-input" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} /></div>
        <div><label className="field-label" htmlFor="blog-body">Body text</label><textarea id="blog-body" className="field-input min-h-52 resize-y" value={body} onChange={(event) => setBody(event.target.value)} required aria-describedby="blog-body-help" /><p id="blog-body-help" className="mt-2 text-sm text-slate-500">Separate paragraphs with a blank line.</p></div>
        <div><label className="field-label" htmlFor="blog-cover">Cover URL <span className="font-normal text-slate-500">(optional)</span></label><input id="blog-cover" type="url" className="field-input" value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} placeholder="https://example.com/image.jpg" /></div>
        {error ? <p role="alert" className="text-red-800">{error}</p> : null}
        <button type="submit" className="button-primary" disabled={submitting || !title.trim() || !body.trim()}>{submitting ? "Saving…" : post ? "Save changes" : "Create draft"}</button>
      </form>
    </section>
  );
}
