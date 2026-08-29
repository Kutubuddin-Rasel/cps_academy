import Image from "next/image";

function safeCoverUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function BlogCover({ coverUrl, title, className }: { coverUrl: string | null; title: string; className: string }) {
  const source = safeCoverUrl(coverUrl);
  if (!source) return null;
  return <Image src={source} alt={`Cover for ${title}`} className={className} width={1200} height={630} />;
}
