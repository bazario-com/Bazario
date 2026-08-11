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

  const load = () => authFetch('/admin/users').then((res) => res.json()).then(setUsers);

  useEffect(() => {
    if (user) load();
  }, [user]);

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
      <h1 className="mb-6 text-2xl font-bold">User Management</h1>

      {error && <p className="mb-4 rounded-card bg-chili-50 px-4 py-2 text-sm text-chili-600">{error}</p>}

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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
