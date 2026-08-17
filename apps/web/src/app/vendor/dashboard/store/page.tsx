'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface Vendor {
  id: string;
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

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

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
    <div className="max-w-2xl">
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
  );
}
