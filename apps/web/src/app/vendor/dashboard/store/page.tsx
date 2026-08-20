'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface ChangeRequest {
  id: string;
  message: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
}

interface Vendor {
  id: string;
  businessName: string;
  businessRegNumber: string | null;
  taxId: string | null;
  store: {
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
  } | null;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-card bg-line ${className}`} />;
}

export default function VendorStorePage() {
  const { authFetch, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [error, setError] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', logoUrl: '', bannerUrl: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [requests, setRequests] = useState<ChangeRequest[] | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestMsg, setRequestMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(false);
    authFetch('/vendors/me')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((v: Vendor) => {
        setVendor(v);
        setForm({
          name: v.store?.name ?? '',
          description: v.store?.description ?? '',
          logoUrl: v.store?.logoUrl ?? '',
          bannerUrl: v.store?.bannerUrl ?? '',
        });
      })
      .catch(() => setError(true));
  }, [authFetch]);

  const loadRequests = useCallback(() => {
    authFetch('/vendors/me/change-requests')
      .then((res) => (res.ok ? res.json() : []))
      .then(setRequests)
      .catch(() => setRequests([]));
  }, [authFetch]);

  useEffect(() => {
    if (!authLoading) {
      load();
      loadRequests();
    }
  }, [authLoading, load, loadRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await authFetch('/vendors/me/store', {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name || undefined,
          description: form.description || undefined,
          logoUrl: form.logoUrl || undefined,
          bannerUrl: form.bannerUrl || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Could not save changes');
      }
      setSaveMsg('Store updated successfully.');
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestMessage.trim()) return;
    setSubmittingRequest(true);
    setRequestMsg(null);
    try {
      const res = await authFetch('/vendors/me/change-request', {
        method: 'POST',
        body: JSON.stringify({ message: requestMessage.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Could not submit request');
      }
      setRequestMessage('');
      setRequestMsg('Request submitted — an admin will review it soon.');
      loadRequests();
    } catch (err) {
      setRequestMsg(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (authLoading) return null;

  if (error) {
    return (
      <div className="rounded-card bg-chili-50 p-4 text-center text-sm text-chili-600">
        <p className="mb-2">Unable to load your store.</p>
        <button onClick={load} className="rounded-card border border-chili px-4 py-1.5 font-semibold hover:bg-chili hover:text-white">
          Try Again
        </button>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink-700">My Store</h1>
          {vendor.store?.slug && (
            <Link href={`/search?q=${encodeURIComponent(vendor.store.name)}`} className="text-sm font-semibold text-marigold-600">
              View My Store →
            </Link>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-card bg-surface p-5 shadow-card">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink-700">Store name</label>
            <input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-card border border-line px-4 py-2.5 focus-visible:outline-2 focus-visible:outline-marigold"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-ink-700">Description</label>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-card border border-line px-4 py-2.5 focus-visible:outline-2 focus-visible:outline-marigold"
            />
          </div>

          <div>
            <label htmlFor="logoUrl" className="mb-1 block text-sm font-medium text-ink-700">Logo URL</label>
            <input
              id="logoUrl"
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              placeholder="https://…"
              className="w-full rounded-card border border-line px-4 py-2.5 focus-visible:outline-2 focus-visible:outline-marigold"
            />
          </div>

          <div>
            <label htmlFor="bannerUrl" className="mb-1 block text-sm font-medium text-ink-700">Banner URL</label>
            <input
              id="bannerUrl"
              type="url"
              value={form.bannerUrl}
              onChange={(e) => setForm((f) => ({ ...f, bannerUrl: e.target.value }))}
              placeholder="https://…"
              className="w-full rounded-card border border-line px-4 py-2.5 focus-visible:outline-2 focus-visible:outline-marigold"
            />
          </div>

          {saveMsg && (
            <p className={`text-sm ${saveMsg.includes('successfully') ? 'text-marigold-600' : 'text-chili'}`}>{saveMsg}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-card bg-marigold px-6 py-2.5 font-semibold text-ink-700 transition hover:bg-marigold-600 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-1 text-lg font-bold text-ink-700">Business Information</h2>
        <p className="mb-4 text-sm text-muted">
          These details are locked once submitted. To update them, send a request below — an admin will make the change.
        </p>

        <div className="mb-4 space-y-2 rounded-card bg-surface p-5 shadow-card">
          <div className="flex justify-between border-b border-line pb-2 text-sm">
            <span className="text-muted">Business Name</span>
            <span className="font-medium text-ink-700">{vendor.businessName}</span>
          </div>
          <div className="flex justify-between border-b border-line pb-2 text-sm">
            <span className="text-muted">Registration Number</span>
            <span className="font-medium text-ink-700">{vendor.businessRegNumber || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Tax ID</span>
            <span className="font-medium text-ink-700">{vendor.taxId || '—'}</span>
          </div>
        </div>

        <form onSubmit={handleRequestSubmit} className="space-y-3 rounded-card border border-dashed border-line p-5">
          <label htmlFor="requestMessage" className="block text-sm font-medium text-ink-700">
            Request a change
          </label>
          <textarea
            id="requestMessage"
            rows={3}
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            placeholder="e.g. Please update my business name to..."
            className="w-full rounded-card border border-line px-4 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-marigold"
          />
          {requestMsg && (
            <p className={`text-sm ${requestMsg.includes('submitted') ? 'text-marigold-600' : 'text-chili'}`}>{requestMsg}</p>
          )}
          <button
            type="submit"
            disabled={submittingRequest || !requestMessage.trim()}
            className="rounded-card bg-ink-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-ink-900 disabled:opacity-50"
          >
            {submittingRequest ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>

        {requests && requests.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-bold text-ink-700">Your Requests</h3>
            <ul className="space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="rounded-card bg-base p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.status === 'RESOLVED' ? 'bg-marigold-50 text-marigold-600' : 'bg-ink-50 text-ink-700'
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-ink-700">{r.message}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
