import type { BlogParagraph } from "./types";

const PARAGRAPH_BREAK = /\n\s*\n/;

export function bodyToBlocks(body: string): BlogParagraph[] {
  return body.trim().split(PARAGRAPH_BREAK).map((paragraph) => ({
    type: "paragraph",
    children: [{ type: "text", text: paragraph.trim() }],
  }));
}

export function blocksToBody(content: BlogParagraph[]): string {
  return content.map((paragraph) => paragraph.children.map((child) => child.text).join("")).join("\n\n");
}

export function blogExcerpt(content: BlogParagraph[], length = 150): string {
  const text = blocksToBody(content).replaceAll("\n", " ").trim();
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}
