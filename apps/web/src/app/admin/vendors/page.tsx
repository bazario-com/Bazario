'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface AdminVendor {
  id: string;
  businessName: string;
  status: string;
  createdAt: string;
  store: { name: string; slug: string } | null;
  user: { firstName: string; lastName: string; email: string };
}

const TABS = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

export default function AdminVendorsPage() {
  const { user, authFetch } = useAuth();
  const [tab, setTab] = useState('PENDING');
  const [vendors, setVendors] = useState<AdminVendor[] | null>(null);

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

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Vendor Approvals</h1>

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
          {vendors.map((v) => (
            <li key={v.id} className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
