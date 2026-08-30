import Link from "next/link";

export default function NotFound() {
  return (
    <section className="max-w-2xl py-8 sm:py-16" aria-labelledby="not-found-title">
      <p className="section-kicker">CPS Academy</p>
      <h1 id="not-found-title" className="page-heading">Page not found</h1>
      <p className="page-intro">The page you’re looking for doesn’t exist or is no longer available.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/courses" className="button-primary">Browse courses</Link>
        <Link href="/" className="button-secondary">Go home</Link>
      </div>
    </section>
  );
}
