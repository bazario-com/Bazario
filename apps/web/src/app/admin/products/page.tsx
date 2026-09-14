'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatPriceCents } from '@/lib/api';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';

interface AdminProduct {
  id: string;
  title: string;
  status: string;
  basePriceCents: number;
  vendor: { businessName: string; store: { name: string } | null };
}

const TABS = ['PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];
const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const { user, authFetch } = useAuth();
  const [tab, setTab] = useState('PENDING_APPROVAL');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    authFetch(`/admin/products?status=${tab}&page=${page}&pageSize=${PAGE_SIZE}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [authFetch, tab, page]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  const approve = async (id: string) => {
    await authFetch(`/admin/products/${id}/approve`, { method: 'POST' });
    load();
  };

  const reject = async (id: string) => {
    const reason = prompt('Reason for rejection (shown to the vendor):');
    if (!reason) return;
    await authFetch(`/admin/products/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    load();
  };

  if (!user) return null;

  const columns: Column<AdminProduct>[] = [
    {
      key: 'title',
      header: 'Product',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-medium">{p.title}</p>
          <p className="text-xs text-muted">{p.vendor.store?.name ?? p.vendor.businessName}</p>
        </div>
      ),
    },
    {
      key: 'basePriceCents',
      header: 'Price',
      sortable: true,
      render: (p) => <span>{formatPriceCents(p.basePriceCents)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (p) =>
        p.status === 'PENDING_APPROVAL' ? (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => approve(p.id)}
              className="rounded-card bg-marigold px-3 py-1.5 text-sm font-semibold text-ink hover:bg-marigold-600"
            >
              Approve
            </button>
            <button
              onClick={() => reject(p.id)}
              className="rounded-card border border-chili px-3 py-1.5 text-sm font-medium text-chili hover:bg-chili-50"
            >
              Reject
            </button>
          </div>
        ) : null,
    },
  ];

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

      <AdminDataTable
        columns={columns}
        rows={products}
        getRowId={(p) => p.id}
        loading={loading}
        error={error}
        onRetry={load}
        emptyMessage="No products in this state."
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
