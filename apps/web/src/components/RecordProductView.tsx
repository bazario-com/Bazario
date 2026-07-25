'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export function RecordProductView({ productId }: { productId: string }) {
  const { user, authFetch } = useAuth();

  useEffect(() => {
    if (!user) return;
    authFetch(`/recently-viewed/${productId}`, { method: 'POST' }).catch(() => {
      // Best-effort — a failed view record shouldn't disrupt browsing.
    });
  }, [user, productId, authFetch]);

  return null;
}
