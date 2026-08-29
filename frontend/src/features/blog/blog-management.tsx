"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError, requestErrorMessage } from "@/lib/api/error";
import { BlogEditor } from "./blog-editor";
import { deleteBlogPost, getManagedPosts, publishBlogPost, unpublishBlogPost } from "./api";
import { formattedBlogDate } from "./blog-card";
import type { ManagedBlogPost } from "./types";

export function BlogManagement() {
  const { state: auth, logout } = useAuth();
  const token = auth.status === "authenticated" ? auth.token : null;
  const [posts, setPosts] = useState<ManagedBlogPost[] | null>(null);
  const [editing, setEditing] = useState<ManagedBlogPost | null>(null);
  const [reload, setReload] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const actionRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void getManagedPosts(token, controller.signal).then((values) => {
      if (!controller.signal.aborted) { setPosts(values); setLoadError(null); }
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) logout();
      else setLoadError(requestErrorMessage(error));
    });
    return () => { controller.abort(); actionRequest.current?.abort(); };
  }, [token, logout, reload]);

  function refresh(message: string) {
    setNotice(message);
    setActionError(null);
    setEditing(null);
    setPosts(null);
    setReload((value) => value + 1);
  }

  async function changePublication(post: ManagedBlogPost) {
    if (!token || actionRequest.current) return;
    const controller = new AbortController();
    actionRequest.current = controller;
    setBusy(post.documentId);
    setNotice(null);
    setActionError(null);
    try {
      if (post.publicationState === "published") await unpublishBlogPost(post.documentId, token, controller.signal);
      else await publishBlogPost(post.documentId, token, controller.signal);
      if (!controller.signal.aborted) refresh(post.publicationState === "published" ? "Post unpublished." : "Post published.");
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        if (error instanceof ApiError && error.status === 401) logout();
        else setActionError(requestErrorMessage(error));
      }
    } finally {
      if (!controller.signal.aborted) setBusy(null);
      if (actionRequest.current === controller) actionRequest.current = null;
    }
  }

  async function remove(post: ManagedBlogPost) {
    if (!token || actionRequest.current || !window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    const controller = new AbortController();
    actionRequest.current = controller;
    setBusy(post.documentId);
    setNotice(null);
    setActionError(null);
    try {
      await deleteBlogPost(post.documentId, token, controller.signal);
      if (!controller.signal.aborted) refresh("Post deleted.");
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        if (error instanceof ApiError && error.status === 401) logout();
        else setActionError(requestErrorMessage(error));
      }
    } finally {
      if (!controller.signal.aborted) setBusy(null);
      if (actionRequest.current === controller) actionRequest.current = null;
    }
  }

  return (
    <div className="space-y-10 [overflow-wrap:anywhere]">
      <header><p className="section-kicker">Publishing workspace</p><h1 className="page-heading">Manage Blog</h1><p className="page-intro">Create clear updates for CPS Academy. Every post starts as a private draft.</p></header>
      {token ? <BlogEditor key={editing?.documentId ?? `new-${reload}`} post={editing} token={token} onSaved={refresh} onCancel={() => setEditing(null)} /> : null}
      <section aria-labelledby="blog-posts-heading">
        <div className="flex items-end justify-between gap-4"><div><p className="section-kicker">Posts</p><h2 id="blog-posts-heading" className="mt-2 text-2xl font-semibold">Publishing queue</h2></div>{editing ? <button type="button" className="button-secondary" onClick={() => setEditing(null)}>Create post</button> : null}</div>
        {notice ? <p role="status" className="mt-5 text-emerald-800">{notice}</p> : null}
        {actionError ? <p role="alert" className="mt-5 text-red-800">{actionError}</p> : null}
        {loadError ? <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6"><p role="alert" className="text-red-800">{loadError}</p><button type="button" className="button-secondary mt-4" onClick={() => { setLoadError(null); setPosts(null); setReload((value) => value + 1); }}>Try again</button></div> : posts === null ? <p role="status" className="mt-6">Loading Blog posts…</p> : posts.length === 0 ? <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">No posts yet. Create the first draft above.</p> : (
          <ul className="mt-6 grid gap-4">
            {posts.map((post) => (
              <li key={post.documentId} className="rounded-2xl border border-slate-200 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h3 className="text-lg font-semibold">{post.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${post.publicationState === "published" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{post.publicationState === "published" ? "Published" : "Draft"}</span></div><p className="mt-2 text-sm text-slate-500">{post.publicationState === "published" ? `Published ${formattedBlogDate(post.publishedAt)}` : "Not visible publicly"}</p></div>
                <div className="mt-5 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
                  <button type="button" className="button-secondary" disabled={busy !== null} onClick={() => setEditing(post)}>Edit</button>
                  <button type="button" className="button-secondary" disabled={busy !== null} onClick={() => { void changePublication(post); }}>{busy === post.documentId ? "Working…" : post.publicationState === "published" ? "Unpublish" : "Publish"}</button>
                  <button type="button" className="button-secondary text-red-800" disabled={busy !== null} onClick={() => { void remove(post); }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
