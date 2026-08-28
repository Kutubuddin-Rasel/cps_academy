export function getStrapiUrl(): string {
  // Keep the literal env access so Next.js can inline this public value.
  const value = process.env.NEXT_PUBLIC_STRAPI_URL?.trim();
  if (!value) throw new Error("Set NEXT_PUBLIC_STRAPI_URL to the Strapi API origin.");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_STRAPI_URL must be a valid HTTP or HTTPS origin.");
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:")
    || url.username || url.password || url.search || url.hash || url.pathname !== "/"
  ) {
    throw new Error("NEXT_PUBLIC_STRAPI_URL must be an HTTP or HTTPS origin without a path or credentials.");
  }
  return url.origin;
}
