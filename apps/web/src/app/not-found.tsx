import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="mb-2 text-3xl font-bold">Page not found</h1>
      <p className="mb-6 text-muted">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link href="/" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink">
        Back to homepage
      </Link>
    </div>
  );
}
