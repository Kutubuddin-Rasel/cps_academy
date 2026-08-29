import type { BlogParagraph } from "./types";

export function BlocksRenderer({ content }: { content: BlogParagraph[] }) {
  return (
    <div className="space-y-5 text-lg leading-8 text-slate-700">
      {content.map((paragraph, index) => (
        <p key={`${index}-${paragraph.children[0]?.text.slice(0, 24) ?? "empty"}`}>
          {paragraph.children.map((child, childIndex) => <span key={`${childIndex}-${child.text.slice(0, 24)}`}>{child.text}</span>)}
        </p>
      ))}
    </div>
  );
}
