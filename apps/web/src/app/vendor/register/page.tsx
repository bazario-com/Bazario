'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function VendorRegisterPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: '',
    storeName: '',
    storeSlug: '',
    storeDescription: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (key === 'storeName') {
      setForm((f) => ({
        ...f,
        storeName: value,
        // Auto-suggest a slug from the store name until the person edits the slug field directly.
        storeSlug: f.storeSlug || value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));
      return;
    }
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authFetch('/vendors/register', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Could not register as a vendor');
      router.push('/vendor/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Log in to start selling</h1>
        <Link href="/login" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold">Sell on Shopina</h1>
      <p className="mb-6 text-sm text-muted">
        Tell us about your business. An admin will review your application before your store goes live.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Business name</label>
          <input
            required
            value={form.businessName}
            onChange={update('businessName')}
            className="w-full rounded-card border border-line px-4 py-2.5"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Store name</label>
          <input
            required
            value={form.storeName}
            onChange={update('storeName')}
            className="w-full rounded-card border border-line px-4 py-2.5"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Store URL</label>
          <div className="flex items-center gap-1 text-sm text-muted">
            <span>bazaario.com/store/</span>
            <input
              required
              value={form.storeSlug}
              onChange={(e) =>
                setForm((f) => ({ ...f, storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
              }
              className="flex-1 rounded-card border border-line px-3 py-2 text-ink900text"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">About your store (optional)</label>
          <textarea
            value={form.storeDescription}
            onChange={update('storeDescription')}
            rows={3}
            className="w-full rounded-card border border-line px-4 py-2.5"
          />
        </div>

        {error && <p className="text-sm text-chili">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-card bg-marigold px-6 py-3 font-semibold text-ink transition hover:bg-marigold-600 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Apply to become a vendor'}
        </button>
      </form>
    </div>
  );
}
