'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { formatPriceCents } from '@/lib/api';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';

interface AdminProduct {
  id: string;
  title: string;
  description: string;
  brand: string | null;
  status: string;
  rejectedReason: string | null;
  basePriceCents: number;
  currency: string;
  discountPct: number;
  averageRating: string;
  reviewCount: number;
  totalSold: number;
  isFeatured: boolean;
  publishedAt: string | null;
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

  const archiveProduct = async (id: string) => {
    if (!confirm('Archive this product? It will be removed from the storefront.')) return;
    await authFetch(`/admin/products/${id}/archive`, { method: 'POST' });
    load();
  };

  const restoreProduct = async (id: string) => {
    if (!confirm('Restore this product to Published?')) return;
    await authFetch(`/admin/products/${id}/restore`, { method: 'POST' });
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
      render: (p) => {
        if (p.status === 'PENDING_APPROVAL') {
          return (
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
          );
        }
        if (p.status === 'PUBLISHED') {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => archiveProduct(p.id)}
                className="rounded-card border border-chili px-3 py-1.5 text-sm font-medium text-chili hover:bg-chili-50"
              >
                Archive
              </button>
            </div>
          );
        }
        if (p.status === 'ARCHIVED') {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => restoreProduct(p.id)}
                className="rounded-card bg-marigold px-3 py-1.5 text-sm font-semibold text-ink hover:bg-marigold-600"
              >
                Restore
              </button>
            </div>
          );
        }
        return null;
      },
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
        renderDrawer={(p, onClose) => (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
            onClick={onClose}
          >
            <div
              className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-card bg-surface p-6 shadow-card sm:rounded-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between">
                <h2 className="text-lg font-bold">{p.title}</h2>
                <button onClick={onClose} className="text-muted hover:text-ink-900">
                  Close
                </button>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Store</dt>
                  <dd>{p.vendor.store?.name ?? p.vendor.businessName}</dd>
                </div>
                {p.brand && (
                  <div>
                    <dt className="text-muted">Brand</dt>
                    <dd>{p.brand}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted">Description</dt>
                  <dd>{p.description}</dd>
                </div>
                <div>
                  <dt className="text-muted">Price</dt>
                  <dd>
                    {formatPriceCents(p.basePriceCents)}
                    {p.discountPct > 0 && <> ({p.discountPct}% off)</>}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Rating</dt>
                  <dd>
                    {Number(p.averageRating).toFixed(1)} {'★'} ({p.reviewCount} review{p.reviewCount !== 1 ? 's' : ''})
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Units Sold</dt>
                  <dd>{p.totalSold}</dd>
                </div>
                {p.isFeatured && (
                  <div>
                    <dt className="text-muted">Featured</dt>
                    <dd>Yes</dd>
                  </div>
                )}
                {p.publishedAt && (
                  <div>
                    <dt className="text-muted">Published</dt>
                    <dd>{new Date(p.publishedAt).toLocaleString()}</dd>
                  </div>
                )}
                {p.rejectedReason && (
                  <div>
                    <dt className="text-muted">Rejection Reason</dt>
                    <dd>{p.rejectedReason}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}
      />
    </div>
  );
}
