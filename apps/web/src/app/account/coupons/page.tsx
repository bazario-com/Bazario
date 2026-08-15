'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatPriceCents } from '@/lib/api';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderCents: number;
  expiresAt: string | null;
}

export default function CouponsPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    authFetch('/coupons/me')
      .then((res) => (res.ok ? res.json() : []))
      .then(setCoupons)
      .catch(() => setCoupons([]));
  }, [user, authFetch]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }).catch(() => {});
  };

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Log in to see your coupons</h1>
        <Link href="/login" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink-700">Log in</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-ink-700">Your Coupons</h1>

      {coupons === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : coupons.length === 0 ? (
        <div className="rounded-card bg-surface p-8 text-center shadow-card">
          <p className="mb-1 font-semibold text-ink-700">No coupons available right now.</p>
          <p className="text-sm text-muted">Check back soon for new offers.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {coupons.map((c) => (
            <li key={c.id} className="rounded-card border border-dashed border-marigold-400 bg-marigold-50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-bold text-ink-700">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : formatPriceCents(c.discountValue) + ' OFF'}
                  </p>
                  {c.description && <p className="text-sm text-ink-400">{c.description}</p>}
                  {c.minOrderCents > 0 && (
                    <p className="mt-1 text-xs text-muted">Min. order {formatPriceCents(c.minOrderCents)}</p>
                  )}
                  {c.expiresAt && (
                    <p className="text-xs text-muted">Expires {new Date(c.expiresAt).toLocaleDateString()}</p>
                  )}
                </div>
                <button
                  onClick={() => copyCode(c.code)}
                  className="shrink-0 rounded-card bg-ink-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink-900"
                >
                  {copiedCode === c.code ? 'Copied!' : c.code}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
