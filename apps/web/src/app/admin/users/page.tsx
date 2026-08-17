'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface AdminUser {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user, authFetch } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);

  const load = () => authFetch('/admin/users').then((res) => res.json()).then(setUsers);

  const exportContacts = async () => {
    const res = await authFetch('/admin/users/export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopina-contacts-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const resetPassword = async (target: AdminUser) => {
    if (!confirm(`Reset the password for ${target.email}? A new temporary password will be generated.`)) return;
    setResetting(target.id);
    setError(null);
    try {
      const res = await authFetch(`/admin/users/${target.id}/reset-password`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Could not reset password');
      setResetResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setResetting(null);
    }
  };

  const toggleActive = async (target: AdminUser) => {
    setError(null);
    const res = await authFetch(`/admin/users/${target.id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !target.isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? 'Could not update user');
      return;
    }
    load();
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={exportContacts} className="rounded-card bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700">Export to Excel</button>
      </div>

      {error && <p className="mb-4 rounded-card bg-chili-50 px-4 py-2 text-sm text-chili-600">{error}</p>}

      {resetResult && (
        <div className="mb-4 rounded-card bg-marigold-50 p-4 text-sm">
          <p className="font-semibold text-ink">Password reset for {resetResult.email}</p>
          <p className="mt-1">
            New temporary password: <code className="rounded bg-white px-2 py-1 font-mono">{resetResult.temporaryPassword}</code>
          </p>
          <p className="mt-1 text-xs text-muted">Share this securely — it won't be shown again.</p>
          <button onClick={() => setResetResult(null)} className="mt-2 text-xs font-semibold text-marigold-600">Dismiss</button>
        </div>
      )}

      {users === null ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card">
              <div>
                <p className="font-medium">
                  {u.firstName} {u.lastName}{' '}
                  <span className="ml-2 rounded-full bg-ink-50 px-2 py-0.5 text-xs font-semibold text-ink">
                    {u.role}
                  </span>
                </p>
                <p className="text-sm text-muted">{u.email}</p>
                {u.phone && <p className="text-xs text-muted">{u.phone}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => resetPassword(u)}
                  disabled={resetting === u.id}
                  className="rounded-card border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-base disabled:opacity-50"
                >
                  {resetting === u.id ? 'Resetting…' : 'Reset Password'}
                </button>
                <button
                  onClick={() => toggleActive(u)}
                  className={`rounded-card px-4 py-2 text-sm font-medium ${
                    u.isActive
                      ? 'border border-chili text-chili hover:bg-chili-50'
                      : 'bg-marigold text-ink hover:bg-marigold-600'
                  }`}
                >
                  {u.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
