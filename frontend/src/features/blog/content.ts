import type { BlogParagraph } from "./types";

const PARAGRAPH_BREAK = /\n\s*\n/;
const WHITESPACE = /\s+/g;

export function bodyToBlocks(body: string): BlogParagraph[] {
  return body.trim().split(PARAGRAPH_BREAK).map((paragraph) => ({
    type: "paragraph",
    children: [{ type: "text", text: paragraph.trim() }],
  }));
}

export function blocksToBody(content: BlogParagraph[]): string {
  return content.map((paragraph) => paragraph.children.map((child) => child.text).join("")).join("\n\n");
}

export function blogExcerpt(content: BlogParagraph[]): string {
  for (const paragraph of content) {
    const text = paragraph.children.map((child) => child.text).join("").replace(WHITESPACE, " ").trim();
    if (text) return text;
  }
  return "";
}
