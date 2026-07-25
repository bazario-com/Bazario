'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
}

export default function AdminCategoriesPage() {
  const { user, authFetch } = useAuth();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', parentId: '' });
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`)
      .then((res) => res.json())
      .then((tree) => {
        // Flatten the public mega-menu tree so admins can see and manage
        // every category (including inactive-only-visible-here ones would
        // need a dedicated admin listing endpoint in a future pass — for
        // now this reuses the public tree, so newly-created inactive
        // categories won't reappear here until reactivated).
        const flat: Category[] = [];
        for (const cat of tree) {
          flat.push(cat);
          if (cat.children) flat.push(...cat.children);
        }
        setCategories(flat);
      });

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await authFetch('/categories', {
      method: 'POST',
      body: JSON.stringify({ ...form, parentId: form.parentId || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? 'Could not create category');
      return;
    }
    setForm({ name: '', slug: '', parentId: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const res = await authFetch(`/categories/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message ?? 'Could not delete category');
      return;
    }
    load();
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Categories</h1>

      <form onSubmit={handleCreate} className="mb-8 space-y-3 rounded-card border border-line p-4">
        <p className="font-medium">Add a category</p>
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-card border border-line px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="slug-like-this"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
            className="rounded-card border border-line px-3 py-2 text-sm"
          />
        </div>
        <select
          value={form.parentId}
          onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
          className="w-full rounded-card border border-line px-3 py-2 text-sm"
        >
          <option value="">No parent (top-level category)</option>
          {categories?.filter((c) => !c.parentId).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-chili">{error}</p>}
        <button type="submit" className="rounded-card bg-marigold px-5 py-2 text-sm font-semibold text-ink hover:bg-marigold-600">
          Create
        </button>
      </form>

      {categories === null ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-card bg-surface p-3 shadow-card">
              <span className={c.parentId ? 'ml-4 text-sm' : 'font-medium'}>{c.name}</span>
              <button onClick={() => handleDelete(c.id)} className="text-sm text-muted hover:text-chili">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
