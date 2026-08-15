'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface FollowedStore {
  id: string;
  store: { id: string; name: string; slug: string; logoUrl: string | null; city: string | null };
}

export default function FollowingStoresPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [stores, setStores] = useState<FollowedStore[] | null>(null);

  useEffect(() => {
    if (!user) return;
    authFetch('/store-follows')
      .then((res) => (res.ok ? res.json() : []))
      .then(setStores)
      .catch(() => setStores([]));
  }, [user, authFetch]);

  const unfollow = async (storeId: string) => {
    setStores((prev) => (prev ? prev.filter((f) => f.store.id !== storeId) : prev));
    await authFetch(`/store-follows/${storeId}`, { method: 'DELETE' }).catch(() => {});
  };

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Log in to see followed stores</h1>
        <Link href="/login" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink-700">Log in</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-ink-700">Stores You Follow</h1>

      {stores === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : stores.length === 0 ? (
        <div className="rounded-card bg-surface p-8 text-center shadow-card">
          <p className="mb-1 font-semibold text-ink-700">Follow stores you love.</p>
          <p className="mb-4 text-sm text-muted">Get updates on their latest products.</p>
          <Link href="/search" className="inline-block rounded-card bg-marigold px-5 py-2.5 text-sm font-semibold text-ink-700">
            Browse Stores
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {stores.map(({ store }) => (
            <li key={store.id} className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-50 font-display font-bold text-ink-700">
                  {store.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-700">{store.name}</p>
                {store.city && <p className="text-xs text-muted">{store.city}</p>}
              </div>
              <button
                onClick={() => unfollow(store.id)}
                className="shrink-0 text-xs font-semibold text-muted hover:text-chili"
              >
                Unfollow
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
