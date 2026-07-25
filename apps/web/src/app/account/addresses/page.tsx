'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  city: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: 'Home', recipientName: '', phone: '', line1: '', city: '' });

  const load = () => authFetch('/addresses').then((res) => res.json()).then(setAddresses);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await authFetch('/addresses', { method: 'POST', body: JSON.stringify(form) });
    setForm({ label: 'Home', recipientName: '', phone: '', line1: '', city: '' });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    setAddresses((prev) => prev?.filter((a) => a.id !== id) ?? null);
    await authFetch(`/addresses/${id}`, { method: 'DELETE' });
  };

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Log in to manage addresses</h1>
        <Link href="/login" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Saved Addresses</h1>

      {addresses === null ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {addresses.map((addr) => (
            <li key={addr.id} className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card">
              <div className="text-sm">
                <p className="font-medium">
                  {addr.label} {addr.isDefault && <span className="text-xs text-marigold-600">(default)</span>}
                </p>
                <p className="text-muted">
                  {addr.recipientName}, {addr.line1}, {addr.city} · {addr.phone}
                </p>
              </div>
              <button onClick={() => handleDelete(addr.id)} className="text-sm text-muted hover:text-chili">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="text-sm font-medium text-ink hover:text-marigold-600">
          + Add a new address
        </button>
      ) : (
        <form onSubmit={handleAdd} className="space-y-2 rounded-card border border-line p-4">
          <div className="grid grid-cols-2 gap-2">
            <input required placeholder="Label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className="rounded-card border border-line px-3 py-2 text-sm" />
            <input required placeholder="Recipient name" value={form.recipientName} onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))} className="rounded-card border border-line px-3 py-2 text-sm" />
          </div>
          <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-card border border-line px-3 py-2 text-sm" />
          <input required placeholder="Address line" value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} className="w-full rounded-card border border-line px-3 py-2 text-sm" />
          <input required placeholder="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="w-full rounded-card border border-line px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="rounded-card bg-ink px-4 py-2 text-sm font-medium text-white">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-card border border-line px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
