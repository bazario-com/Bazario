'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatPriceCents } from '@/lib/api';

interface AdminProduct {
  id: string;
  title: string;
  status: string;
  basePriceCents: number;
  vendor: { businessName: string; store: { name: string } | null };
}

const TABS = ['PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];

export default function AdminProductsPage() {
  const { user, authFetch } = useAuth();
  const [tab, setTab] = useState('PENDING_APPROVAL');
  const [products, setProducts] = useState<AdminProduct[] | null>(null);

  const load = (status: string) =>
    authFetch(`/admin/products?status=${status}`).then((res) => res.json()).then(setProducts);

  useEffect(() => {
    if (user) load(tab);
  }, [user, tab]);

  const approve = async (id: string) => {
    await authFetch(`/admin/products/${id}/approve`, { method: 'POST' });
    load(tab);
  };

  const reject = async (id: string) => {
    const reason = prompt('Reason for rejection (shown to the vendor):');
    if (!reason) return;
    await authFetch(`/admin/products/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    load(tab);
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Product Approvals</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t ? 'bg-ink text-white' : 'border border-line text-muted'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {products === null ? (
        <p className="text-muted">Loading…</p>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-muted">No products in this state.</p>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-muted">
                  {p.vendor.store?.name ?? p.vendor.businessName} · {formatPriceCents(p.basePriceCents)}
                </p>
              </div>
              {p.status === 'PENDING_APPROVAL' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(p.id)}
                    className="rounded-card bg-marigold px-4 py-2 text-sm font-semibold text-ink hover:bg-marigold-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reject(p.id)}
                    className="rounded-card border border-chili px-4 py-2 text-sm font-medium text-chili hover:bg-chili-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
