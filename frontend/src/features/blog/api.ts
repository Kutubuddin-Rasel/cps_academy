import { apiRequest, publicApiRequest } from "@/lib/api/request";
import { bodyToBlocks } from "./content";
import { parseManagedPost, parseManagedPosts, parsePublishedPost, parsePublishedPosts } from "./parsers";
import type { BlogEditorInput, BlogPost, ManagedBlogPost } from "./types";

function blogData(input: BlogEditorInput) {
  return {
    title: input.title.trim(),
    content: bodyToBlocks(input.body),
    coverUrl: input.coverUrl.trim() || null,
  };
}

export async function getPublishedPosts(signal: AbortSignal): Promise<BlogPost[]> {
  return parsePublishedPosts(await publicApiRequest("/api/blog", signal));
}

export async function getPublishedPost(documentId: string, signal: AbortSignal): Promise<BlogPost> {
  return parsePublishedPost(await publicApiRequest(`/api/blog/${encodeURIComponent(documentId)}`, signal));
}

export async function getManagedPosts(token: string, signal: AbortSignal): Promise<ManagedBlogPost[]> {
  return parseManagedPosts(await apiRequest("/api/blog/manage", { token, signal }));
}

export async function createBlogPost(input: BlogEditorInput, token: string, signal: AbortSignal): Promise<BlogPost> {
  return parseManagedPost(await apiRequest("/api/blog-posts", {
    method: "POST", token, signal, body: { data: blogData(input) },
  }));
}

export async function updateBlogPost(documentId: string, input: BlogEditorInput, token: string, signal: AbortSignal): Promise<BlogPost> {
  return parseManagedPost(await apiRequest(`/api/blog-posts/${encodeURIComponent(documentId)}`, {
    method: "PUT", token, signal, body: { data: blogData(input) },
  }));
}

export async function publishBlogPost(documentId: string, token: string, signal: AbortSignal): Promise<BlogPost> {
  return parseManagedPost(await apiRequest(`/api/blog-posts/${encodeURIComponent(documentId)}/publish`, {
    method: "POST", token, signal,
  }));
}

export async function unpublishBlogPost(documentId: string, token: string, signal: AbortSignal): Promise<BlogPost> {
  return parseManagedPost(await apiRequest(`/api/blog-posts/${encodeURIComponent(documentId)}/unpublish`, {
    method: "POST", token, signal,
  }));
}

export async function deleteBlogPost(documentId: string, token: string, signal: AbortSignal): Promise<void> {
  await apiRequest(`/api/blog-posts/${encodeURIComponent(documentId)}`, { method: "DELETE", token, signal });
}
