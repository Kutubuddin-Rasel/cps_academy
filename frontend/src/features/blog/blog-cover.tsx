import Image from "next/image";

interface BlogCoverProps {
  coverUrl: string | null;
  title: string;
  className: string;
  sizes?: string;
}

export function safeBlogCoverUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function BlogCover({
  coverUrl,
  title,
  className,
  sizes = "(max-width: 768px) 100vw, 768px",
}: BlogCoverProps) {
  const source = safeBlogCoverUrl(coverUrl);
  if (!source) return null;
  return <Image src={source} alt={`Cover for ${title}`} className={className} width={1200} height={630} sizes={sizes} />;
}
