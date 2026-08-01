'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface Announcement {
  id: string;
  message: string;
  type: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

const TYPES = ['INFO', 'SALE', 'VENDOR_SPOTLIGHT'];

export default function AdminAnnouncementsPage() {
  const { user, authFetch } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [form, setForm] = useState({ message: '', type: 'INFO', startsAt: '', endsAt: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    authFetch('/admin/announcements').then((res) => res.json()).then(setAnnouncements);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await authFetch('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify({
        message: form.message,
        type: form.type,
        startsAt: form.startsAt || undefined,
        endsAt: form.endsAt || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? 'Could not create announcement');
      return;
    }
    setForm({ message: '', type: 'INFO', startsAt: '', endsAt: '' });
    load();
  };

  const toggleActive = async (a: Announcement) => {
    await authFetch(`/admin/announcements/${a.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !a.isActive }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    await authFetch(`/admin/announcements/${id}`, { method: 'DELETE' });
    load();
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Announcements</h1>

      <form onSubmit={handleCreate} className="mb-8 space-y-4 rounded-card bg-surface p-4 shadow-card">
        <div>
          <label htmlFor="message" className="mb-1 block text-sm font-medium">Message</label>
          <input
            id="message"
            required
            maxLength={280}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded-card border border-line px-4 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="rounded-card border border-line px-3 py-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            className="rounded-card border border-line px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            className="rounded-card border border-line px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-chili">{error}</p>}
        <button type="submit" className="rounded-card bg-marigold px-5 py-2 text-sm font-semibold text-ink hover:bg-marigold-600">
          Create
        </button>
      </form>

      {announcements === null ? (
        <p className="text-muted">Loading...</p>
      ) : (
        <ul className="space-y-2">
          {announcements.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card">
              <div>
                <p className="font-medium">{a.message}</p>
                <p className="text-sm text-muted">
                  {a.type} · {a.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(a)}
                  className={`rounded-card px-4 py-2 text-sm font-medium ${
                    a.isActive ? 'border border-chili text-chili hover:bg-chili-50' : 'bg-marigold text-ink hover:bg-marigold-600'
                  }`}
                >
                  {a.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-sm text-muted hover:text-chili"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
