import { ApiError } from "@/lib/api/error";
import { isRecord } from "@/lib/api/response-guards";
import type { BlogParagraph, BlogPost, BlogTextNode, ManagedBlogPost } from "./types";

function parseTextNode(value: unknown): BlogTextNode | null {
  if (!isRecord(value) || value.type !== "text" || typeof value.text !== "string") return null;
  return { type: "text", text: value.text };
}

function parseContent(value: unknown): BlogParagraph[] {
  if (!Array.isArray(value)) {
    throw new ApiError(502, "CPS Academy returned invalid Blog content. Please try again.");
  }
  const paragraphs: BlogParagraph[] = [];
  for (const block of value) {
    // CPS Academy authors paragraphs only. Unknown Blocks are skipped as text-safe unsupported content.
    if (!isRecord(block) || block.type !== "paragraph") continue;
    if (!Array.isArray(block.children)) {
      throw new ApiError(502, "CPS Academy returned invalid Blog content. Please try again.");
    }
    const children = block.children.flatMap((child: unknown) => {
      const text = parseTextNode(child);
      return text ? [text] : [];
    });
    paragraphs.push({ type: "paragraph", children });
  }
  return paragraphs;
}

function parsePublishedAt(value: unknown, nullable: boolean): string | null {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || !value.trim() || Number.isNaN(Date.parse(value))) {
    throw new ApiError(502, "CPS Academy returned an invalid Blog date. Please try again.");
  }
  return value;
}

function parsePost(value: unknown, publishedAtNullable: boolean): BlogPost {
  if (!isRecord(value)
    || typeof value.documentId !== "string" || !value.documentId.trim()
    || typeof value.title !== "string" || !value.title.trim()
    || (value.coverUrl !== null && typeof value.coverUrl !== "string")) {
    throw new ApiError(502, "CPS Academy returned an invalid Blog post. Please try again.");
  }
  return {
    documentId: value.documentId,
    title: value.title,
    content: parseContent(value.content),
    coverUrl: value.coverUrl,
    publishedAt: parsePublishedAt(value.publishedAt, publishedAtNullable),
  };
}

export function parsePublishedPosts(payload: unknown): BlogPost[] {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.posts)) {
    throw new ApiError(502, "CPS Academy returned an invalid Blog list. Please try again.");
  }
  return payload.data.posts.map((value: unknown) => parsePost(value, false));
}

export function parsePublishedPost(payload: unknown): BlogPost {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new ApiError(502, "CPS Academy returned an invalid Blog post. Please try again.");
  }
  return parsePost(payload.data.post, false);
}

export function parseManagedPosts(payload: unknown): ManagedBlogPost[] {
  if (!isRecord(payload) || !isRecord(payload.data) || !Array.isArray(payload.data.posts)) {
    throw new ApiError(502, "CPS Academy returned an invalid Blog management list. Please try again.");
  }
  return payload.data.posts.map((value: unknown) => {
    if (!isRecord(value) || (value.publicationState !== "draft" && value.publicationState !== "published")) {
      throw new ApiError(502, "CPS Academy returned an invalid Blog publication state. Please try again.");
    }
    return { ...parsePost(value, true), publicationState: value.publicationState };
  });
}

export function parseManagedPost(payload: unknown): BlogPost {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new ApiError(502, "CPS Academy returned an invalid Blog post. Please try again.");
  }
  return parsePost(payload.data.post, true);
}
