'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

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

export default function AdminVendorsPage() {
  const { user, authFetch } = useAuth();
  const [tab, setTab] = useState('PENDING');
  const [vendors, setVendors] = useState<AdminVendor[] | null>(null);
  const [editingCommission, setEditingCommission] = useState<Record<string, string>>({});
  const [savingCommission, setSavingCommission] = useState<string | null>(null);

  const load = (status: string) =>
    authFetch(`/admin/vendors?status=${status}`).then((res) => res.json()).then(setVendors);

  useEffect(() => {
    if (user) load(tab);
  }, [user, tab]);

  const approve = async (id: string) => {
    await authFetch(`/admin/vendors/${id}/approve`, { method: 'POST' });
    load(tab);
  };

  const reject = async (id: string) => {
    const reason = prompt('Reason for rejection (shown to the vendor):');
    if (!reason) return;
    await authFetch(`/admin/vendors/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
    load(tab);
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
      await load(tab);
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendor Approvals</h1>
        <Link href="/admin/vendors/change-requests" className="text-sm font-semibold text-marigold-600">
          Info Change Requests →
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

      {vendors === null ? (
        <p className="text-muted">Loading…</p>
      ) : vendors.length === 0 ? (
        <p className="py-16 text-center text-muted">No vendors in this state.</p>
      ) : (
        <ul className="space-y-2">
          {vendors.map((v) => {
            const currentPercent = (v.commissionRateBps / 100).toString();
            const editValue = editingCommission[v.id] ?? currentPercent;
            const isEditing = v.id in editingCommission;
            return (
              <li key={v.id} className="rounded-card bg-surface p-4 shadow-card">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{v.businessName}</p>
                    <p className="text-sm text-muted">
                      {v.store?.name} · {v.user.firstName} {v.user.lastName} ({v.user.email})
                    </p>
                  </div>
                  {v.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(v.id)}
                        className="rounded-card bg-marigold px-4 py-2 text-sm font-semibold text-ink hover:bg-marigold-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reject(v.id)}
                        className="rounded-card border border-chili px-4 py-2 text-sm font-medium text-chili hover:bg-chili-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 border-t border-line pt-3">
                  <label className="text-sm text-muted">Commission:</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={editValue}
                    onChange={(e) => setEditingCommission((ed) => ({ ...ed, [v.id]: e.target.value }))}
                    className="w-20 rounded-card border border-line px-2 py-1 text-sm"
                  />
                  <span className="text-sm text-muted">%</span>
                  {isEditing && editValue !== currentPercent && (
                    <button
                      onClick={() => saveCommission(v.id)}
                      disabled={savingCommission === v.id}
                      className="rounded-card bg-ink px-3 py-1 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
                    >
                      {savingCommission === v.id ? 'Saving…' : 'Save'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
