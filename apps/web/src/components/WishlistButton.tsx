'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export function WishlistButton({ productId }: { productId: string }) {
  const { user, authFetch } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Best-effort check on mount — acceptable to skip a loading spinner here;
  // a brief "not yet saved" flash on a slow connection is a fine tradeoff
  // against fetching every product's wishlist status from a list endpoint.
  useEffect(() => {
    if (!user) return;
    authFetch('/wishlist')
      .then((res) => (res.ok ? res.json() : []))
      .then((items) => setSaved(items.some((i: any) => i.productId === productId)))
      .catch(() => {});
  }, [user, productId, authFetch]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || busy) return;
    setBusy(true);
    try {
      if (saved) {
        await authFetch(`/wishlist/${productId}`, { method: 'DELETE' });
        setSaved(false);
      } else {
        await authFetch('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) });
        setSaved(true);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-base shadow-card transition hover:scale-110"
    >
      {saved ? '❤️' : '🤍'}
    </button>
  );
}
