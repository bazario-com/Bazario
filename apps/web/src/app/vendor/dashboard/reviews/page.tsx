'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  isVerifiedPurchase: boolean;
  product: { id: string; title: string; slug: string };
  user: { firstName: string; lastName: string };
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-card bg-line ${className}`} />;
}

export default function VendorReviewsPage() {
  const { authFetch, loading: authLoading } = useAuth();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    authFetch(`/vendors/me/reviews?page=${page}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, [authFetch, page]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  if (authLoading) return null;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-ink-700">Customer Reviews</h1>
      <p className="mb-6 text-sm text-muted">
        Reviews are view-only — replying isn't supported yet.
      </p>

      {error ? (
        <div className="rounded-card bg-chili-50 p-4 text-center text-sm text-chili-600">
          <p className="mb-2">Unable to load reviews.</p>
          <button onClick={load} className="rounded-card border border-chili px-4 py-1.5 font-semibold hover:bg-chili hover:text-white">
            Try Again
          </button>
        </div>
      ) : data === null ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : data.reviews.length === 0 ? (
        <p className="rounded-card bg-surface p-8 text-center text-sm text-muted shadow-card">
          Your customer reviews will appear here.
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {data.reviews.map((r) => (
              <li key={r.id} className="rounded-card bg-surface p-4 shadow-card">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-marigold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="font-medium text-ink-700">{r.user.firstName} {r.user.lastName}</span>
                  {r.isVerifiedPurchase && (
                    <span className="rounded-full bg-marigold-50 px-2 py-0.5 text-xs font-medium text-marigold-600">
                      Verified purchase
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="mb-1 text-xs text-muted">on {r.product.title}</p>
                {r.title && <p className="font-medium text-ink-700">{r.title}</p>}
                {r.body && <p className="text-sm text-muted">{r.body}</p>}
              </li>
            ))}
          </ul>

          {data.pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-card border border-line px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-muted">Page {data.pagination.page} of {data.pagination.totalPages}</span>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-card border border-line px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
