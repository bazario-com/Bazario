'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { formatPriceCents } from '@/lib/api';

interface VendorProduct {
  id: string;
  title: string;
  status: string;
  basePriceCents: number;
  discountPct: number;
  rejectedReason?: string | null;
  variants: { stockQuantity: number }[];
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-line text-muted',
  PENDING_APPROVAL: 'bg-marigold-50 text-marigold-600',
  PUBLISHED: 'bg-ink-50 text-ink',
  REJECTED: 'bg-chili-50 text-chili-600',
  ARCHIVED: 'bg-line text-muted',
};

export default function VendorProductsPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<VendorProduct[] | null>(null);

  const load = () => authFetch('/vendors/me/products').then((res) => res.json()).then(setProducts);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleArchive = async (id: string) => {
    if (!confirm('Remove this product from your store?')) return;
    await authFetch(`/vendors/me/products/${id}`, { method: 'DELETE' });
    load();
  };

  if (authLoading) return null;
  if (!user) return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Products</h1>
        <Link href="/vendor/dashboard/products/new" className="rounded-card bg-marigold px-5 py-2.5 font-semibold text-ink hover:bg-marigold-600">
          + Add Product
        </Link>
      </div>

      {products === null ? (
        <p className="text-muted">Loading…</p>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-muted">You haven't listed any products yet.</p>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => {
            const totalStock = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
            return (
              <li key={p.id} className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_STYLES[p.status] ?? ''}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                    <span className="text-muted">Stock: {totalStock}</span>
                  </div>
                  {p.status === 'REJECTED' && p.rejectedReason && (
                    <p className="mt-1 text-xs text-chili">{p.rejectedReason}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="price-tag font-semibold">{formatPriceCents(p.basePriceCents)}</span>
                  <Link href={`/vendor/dashboard/products/${p.id}/edit`} className="text-sm font-medium text-ink hover:text-marigold-600">
                    Edit
                  </Link>
                  <button onClick={() => handleArchive(p.id)} className="text-sm text-muted hover:text-chili">
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
