'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSION_CATEGORIES, permissionLabel } from '@/lib/admin-permissions';

interface RolePermission {
  permission: string;
}

interface AdminRole {
  id: string;
  name: string;
  description: string | null;
  permissions: RolePermission[];
  _count: { assignments: number };
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-card bg-line ${className}`} />;
}

const EMPTY_FORM = { name: '', description: '', permissions: new Set<string>() };

export default function AdminRolesPage() {
  const { authFetch, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AdminRole[] | null>(null);
  const [error, setError] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setForbidden(false);
    authFetch('/admin/roles')
      .then((res) => {
        if (res.status === 403) {
          setForbidden(true);
          return null;
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data) setRoles(data);
      })
      .catch(() => setError(true));
  }, [authFetch]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, permissions: new Set() });
    setFormMsg(null);
    setShowForm(true);
  };

  const startEdit = (role: AdminRole) => {
    setEditingId(role.id);
    setForm({
      name: role.name,
      description: role.description ?? '',
      permissions: new Set(role.permissions.map((p) => p.permission)),
    });
    setFormMsg(null);
    setShowForm(true);
  };

  const togglePermission = (key: string) => {
    setForm((f) => {
      const next = new Set(f.permissions);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...f, permissions: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormMsg(null);
    try {
      const body = JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        permissions: Array.from(form.permissions),
      });
      const res = editingId
        ? await authFetch(`/admin/roles/${editingId}`, { method: 'PATCH', body })
        : await authFetch('/admin/roles', { method: 'POST', body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Could not save role');
      }
      setShowForm(false);
      load();
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: AdminRole) => {
    if (!confirm(`Delete the "${role.name}" role?`)) return;
    const res = await authFetch(`/admin/roles/${role.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message ?? 'Could not delete role');
      return;
    }
    load();
  };

  if (authLoading) return null;

  if (forbidden) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Only the Super Admin can manage roles</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles &amp; Permissions</h1>
          <p className="text-sm text-muted">Define what each management role can access.</p>
        </div>
        <button
          onClick={startCreate}
          className="rounded-card bg-marigold px-5 py-2.5 font-semibold text-ink hover:bg-marigold-600"
        >
          + New Role
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 rounded-card bg-surface p-5 shadow-card">
          <h2 className="font-semibold">{editingId ? 'Edit Role' : 'New Role'}</h2>
          <div>
            <label htmlFor="roleName" className="mb-1 block text-sm font-medium">Role name</label>
            <input
              id="roleName"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Vendor Manager"
              className="w-full rounded-card border border-line px-4 py-2.5"
            />
          </div>
          <div>
            <label htmlFor="roleDescription" className="mb-1 block text-sm font-medium">Description (optional)</label>
            <input
              id="roleDescription"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-card border border-line px-4 py-2.5"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Permissions</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {PERMISSION_CATEGORIES.map((cat) => (
                <div key={cat.label} className="rounded-card border border-line p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {cat.icon} {cat.label}
                  </p>
                  <div className="space-y-1.5">
                    {cat.permissions.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.permissions.has(p.key)}
                          onChange={() => togglePermission(p.key)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {formMsg && <p className="text-sm text-chili">{formMsg}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-card bg-marigold px-5 py-2.5 font-semibold text-ink hover:bg-marigold-600 disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Role'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-card border border-line px-5 py-2.5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error ? (
        <div className="rounded-card bg-chili-50 p-4 text-center text-sm text-chili-600">
          <p className="mb-2">Unable to load roles.</p>
          <button onClick={load} className="rounded-card border border-chili px-4 py-1.5 font-semibold hover:bg-chili hover:text-white">
            Try Again
          </button>
        </div>
      ) : roles === null ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : roles.length === 0 ? (
        <p className="rounded-card bg-surface p-8 text-center text-sm text-muted shadow-card">
          No roles yet — create one to start delegating specific duties.
        </p>
      ) : (
        <ul className="space-y-3">
          {roles.map((role) => (
            <li key={role.id} className="rounded-card bg-surface p-5 shadow-card">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-semibold">{role.name}</p>
                  {role.description && <p className="text-sm text-muted">{role.description}</p>}
                  <p className="mt-1 text-xs text-muted">{role._count.assignments} team member{role._count.assignments !== 1 ? 's' : ''} assigned</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => startEdit(role)} className="text-sm font-medium text-ink hover:text-marigold-600">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(role)} className="text-sm text-muted hover:text-chili">
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((p) => (
                  <span key={p.permission} className="rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink">
                    {permissionLabel(p.permission)}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
