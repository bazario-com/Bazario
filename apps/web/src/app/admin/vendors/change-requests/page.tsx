'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface ChangeRequest {
  id: string;
  vendorId: string;
  message: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
  vendor: {
    businessName: string;
    businessRegNumber: string | null;
    taxId: string | null;
  };
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-card bg-line ${className}`} />;
}

export default function AdminChangeRequestsPage() {
  const { authFetch, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<ChangeRequest[] | null>(null);
  const [error, setError] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ businessName: '', businessRegNumber: '', taxId: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(false);
    authFetch('/admin/vendors/change-requests?status=PENDING')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setRequests)
      .catch(() => setError(true));
  }, [authFetch]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const startEditing = (r: ChangeRequest) => {
    setEditingId(r.id);
    setSaveMsg(null);
    setForm({
      businessName: r.vendor.businessName,
      businessRegNumber: r.vendor.businessRegNumber ?? '',
      taxId: r.vendor.taxId ?? '',
    });
  };

  const applyChange = async (r: ChangeRequest) => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await authFetch(`/admin/vendors/${r.vendorId}/registration-info`, {
        method: 'PATCH',
        body: JSON.stringify({
          businessName: form.businessName || undefined,
          businessRegNumber: form.businessRegNumber || undefined,
          taxId: form.taxId || undefined,
          requestId: r.id,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Could not update vendor info');
      }
      setEditingId(null);
      load();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Vendor Info Change Requests</h1>
      <p className="mb-6 text-sm text-muted">
        Vendors can't self-edit business name, registration number, or tax ID — review requests and apply changes here.
      </p>

      {error ? (
        <div className="rounded-card bg-chili-50 p-4 text-center text-sm text-chili-600">
          <p className="mb-2">Unable to load requests.</p>
          <button onClick={load} className="rounded-card border border-chili px-4 py-1.5 font-semibold hover:bg-chili hover:text-white">
            Try Again
          </button>
        </div>
      ) : requests === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : requests.length === 0 ? (
        <p className="rounded-card bg-surface p-8 text-center text-sm text-muted shadow-card">
          No pending requests.
        </p>
      ) : (
        <ul className="space-y-4">
          {requests.map((r) => (
            <li key={r.id} className="rounded-card bg-surface p-5 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-ink-700">{r.vendor.businessName}</p>
                <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mb-3 rounded-card bg-base p-3 text-sm text-ink-700">{r.message}</p>

              {editingId === r.id ? (
                <div className="space-y-2 rounded-card border border-line p-3">
                  <input
                    value={form.businessName}
                    onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                    placeholder="Business name"
                    className="w-full rounded-card border border-line px-3 py-2 text-sm"
                  />
                  <input
                    value={form.businessRegNumber}
                    onChange={(e) => setForm((f) => ({ ...f, businessRegNumber: e.target.value }))}
                    placeholder="Registration number"
                    className="w-full rounded-card border border-line px-3 py-2 text-sm"
                  />
                  <input
                    value={form.taxId}
                    onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
                    placeholder="Tax ID"
                    className="w-full rounded-card border border-line px-3 py-2 text-sm"
                  />
                  {saveMsg && <p className="text-sm text-chili">{saveMsg}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => applyChange(r)}
                      disabled={saving}
                      className="rounded-card bg-marigold px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-marigold-600 disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Apply & Resolve'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-card border border-line px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startEditing(r)}
                  className="rounded-card bg-ink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-900"
                >
                  Review & Edit
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
