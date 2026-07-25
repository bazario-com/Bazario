'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { formatPriceCents } from '@/lib/api';

interface WishlistEntry {
  id: string;
  productId: string;
  product: {
    title: string;
    slug: string;
    basePriceCents: number;
    discountPct: number;
  };
}

export default function WishlistPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistEntry[] | null>(null);

  useEffect(() => {
    if (!user) return;
    authFetch('/wishlist')
      .then((res) => res.json())
      .then(setItems);
  }, [user, authFetch]);

  const remove = async (productId: string) => {
    setItems((prev) => prev?.filter((i) => i.productId !== productId) ?? null);
    await authFetch(`/wishlist/${productId}`, { method: 'DELETE' });
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Log in to see your wishlist</h1>
        <Link href="/login" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your Wishlist</h1>

      {items === null ? (
        <p className="text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-muted">
          Nothing saved yet — tap the heart on any product to add it here.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-card bg-surface p-3 shadow-card">
              <Link href={`/product/${item.product.slug}`} className="line-clamp-2 font-medium hover:text-ink">
                {item.product.title}
              </Link>
              <p className="price-tag mt-1 font-semibold text-chili">
                {formatPriceCents(
                  Math.round(item.product.basePriceCents * (1 - item.product.discountPct / 100)),
                )}
              </p>
              <button
                onClick={() => remove(item.productId)}
                className="mt-2 text-sm text-muted hover:text-chili"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
