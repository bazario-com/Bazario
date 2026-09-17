'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';
import { relativeTime } from '@/lib/format-time';

interface AdminVendor {
  id: string;
  businessName: string;
  status: string;
  createdAt: string;
  commissionRateBps: number;
  store: { name: string; slug: string } | null;
  user: { firstName: string; lastName: string; email: string };
}

const TABS = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
const PAGE_SIZE = 20;

export default function AdminVendorsPage() {
  const { user, authFetch } = useAuth();
  const [tab, setTab] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingCommission, setEditingCommission] = useState<Record<string, string>>({});
  const [savingCommission, setSavingCommission] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    authFetch(`/admin/vendors?status=${tab}&page=${page}&pageSize=${PAGE_SIZE}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setVendors(data.vendors);
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
    await authFetch(`/admin/vendors/${id}/approve`, { method: 'POST' });
    load();
  };

  const reject = async (id: string) => {
    const reason = prompt('Reason for rejection (shown to the vendor):');
    if (!reason) return;
    await authFetch(`/admin/vendors/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    load();
  };

  const suspend = async (id: string) => {
    const reason = prompt('Reason for suspension (shown to the vendor):');
    if (!reason) return;
    await authFetch(`/admin/vendors/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) });
    load();
  };

  const reactivate = async (id: string) => {
    if (!confirm('Reactivate this vendor?')) return;
    await authFetch(`/admin/vendors/${id}/reactivate`, { method: 'POST' });
    load();
  };

  const saveCommission = async (id: string) => {
    const percentStr = editingCommission[id];
    const percent = parseFloat(percentStr);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      alert('Enter a valid commission percentage between 0 and 100');
      return;
    }
    setSavingCommission(id);
    try {
      await authFetch(`/admin/vendors/${id}/commission`, {
        method: 'PATCH',
        body: JSON.stringify({ commissionRateBps: Math.round(percent * 100) }),
      });
      load();
      setEditingCommission((e) => {
        const next = { ...e };
        delete next[id];
        return next;
      });
    } finally {
      setSavingCommission(null);
    }
  };

  if (!user) return null;

  const columns: Column<AdminVendor>[] = [
    {
      key: 'businessName',
      header: 'Business',
      sortable: true,
      render: (v) => (
        <div>
          <p className="font-medium">{v.businessName}</p>
          <p className="text-xs text-muted">
            {v.store?.name} {'\u00b7'} {v.user.firstName} {v.user.lastName} ({v.user.email})
          </p>
        </div>
      ),
    },
    {
      key: 'commissionRateBps',
      header: 'Commission',
      sortable: true,
      render: (v) => {
        const currentPercent = (v.commissionRateBps / 100).toString();
        const editValue = editingCommission[v.id] ?? currentPercent;
        const isEditing = v.id in editingCommission;
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={editValue}
              onChange={(e) => setEditingCommission((ed) => ({ ...ed, [v.id]: e.target.value }))}
              className="w-16 rounded-card border border-line px-2 py-1 text-sm"
            />
            <span className="text-sm text-muted">%</span>
            {isEditing && editValue !== currentPercent && (
              <button
                onClick={() => saveCommission(v.id)}
                disabled={savingCommission === v.id}
                className="rounded-card bg-ink px-2 py-1 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
              >
                {savingCommission === v.id ? '...' : 'Save'}
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Applied',
      sortable: true,
      render: (v) => <span className="whitespace-nowrap text-muted">{relativeTime(v.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (v) => {
        if (v.status === 'PENDING') {
          return (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => approve(v.id)}
                className="rounded-card bg-marigold px-3 py-1.5 text-sm font-semibold text-ink hover:bg-marigold-600"
              >
                Approve
              </button>
              <button
                onClick={() => reject(v.id)}
                className="rounded-card border border-chili px-3 py-1.5 text-sm font-medium text-chili hover:bg-chili-50"
              >
                Reject
              </button>
            </div>
          );
        }
        if (v.status === 'APPROVED') {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => suspend(v.id)}
                className="rounded-card border border-chili px-3 py-1.5 text-sm font-medium text-chili hover:bg-chili-50"
              >
                Suspend
              </button>
            </div>
          );
        }
        if (v.status === 'SUSPENDED') {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => reactivate(v.id)}
                className="rounded-card bg-marigold px-3 py-1.5 text-sm font-semibold text-ink hover:bg-marigold-600"
              >
                Reactivate
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendor Approvals</h1>
        <Link href="/admin/vendors/change-requests" className="text-sm font-semibold text-marigold-600">
          Info Change Requests {'\u2192'}
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t ? 'bg-ink text-white' : 'border border-line text-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AdminDataTable
        columns={columns}
        rows={vendors}
        getRowId={(v) => v.id}
        loading={loading}
        error={error}
        onRetry={load}
        emptyMessage="No vendors in this state."
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
