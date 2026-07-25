'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function ReviewForm({ productId }: { productId: string }) {
  const { user, authFetch } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user) {
    return (
      <p className="text-sm text-muted">
        <button onClick={() => router.push('/login')} className="font-medium text-ink hover:text-marigold-600">
          Log in
        </button>{' '}
        to write a review.
      </p>
    );
  }

  if (submitted) {
    return <p className="text-sm text-marigold-600">Thanks — your review has been posted.</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authFetch(`/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, title: title || undefined, body: body || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Could not submit review');
      setSubmitted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-card border border-line p-4">
      <div>
        <label htmlFor="rating" className="mb-1 block text-sm font-medium">
          Your rating
        </label>
        <select
          id="rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded-card border border-line px-3 py-2"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {'★'.repeat(n)}
              {'☆'.repeat(5 - n)}
            </option>
          ))}
        </select>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full rounded-card border border-line px-4 py-2.5"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your experience with this product"
        rows={3}
        className="w-full rounded-card border border-line px-4 py-2.5"
      />
      {error && <p className="text-sm text-chili">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-card bg-marigold px-5 py-2 font-semibold text-ink hover:bg-marigold-600 disabled:opacity-60"
      >
        {submitting ? 'Posting…' : 'Post Review'}
      </button>
    </form>
  );
}
