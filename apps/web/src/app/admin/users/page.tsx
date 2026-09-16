'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';
import { relativeTime } from '@/lib/format-time';

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

const ROLES = ['', 'CUSTOMER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN'];
const PAGE_SIZE = 20;

function AdminUsersContent() {
  const { user, authFetch } = useAuth();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [role, setRole] = useState('');
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resetResult, setResetResult] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (role) params.set('role', role);
    if (search) params.set('search', search);
    authFetch(`/admin/users?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [authFetch, role, search, page]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  useEffect(() => {
    setPage(1);
  }, [role, search]);

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

  const resetPassword = async (target: AdminUser) => {
    if (!confirm(`Reset the password for ${target.email}? A new temporary password will be generated.`)) return;
    setResetting(target.id);
    setActionError(null);
    try {
      const res = await authFetch(`/admin/users/${target.id}/reset-password`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Could not reset password');
      setResetResult(data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setResetting(null);
    }
  };

  const toggleActive = async (target: AdminUser) => {
    setActionError(null);
    const res = await authFetch(`/admin/users/${target.id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !target.isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      setActionError(data.message ?? 'Could not update user');
      return;
    }
    load();
  };

  if (!user) return null;

  const columns: Column<AdminUser>[] = [
    {
      key: 'firstName',
      header: 'Name',
      sortable: true,
      render: (u) => (
        <div>
          <p className="font-medium">
            {u.firstName} {u.lastName}{' '}
            <span className="ml-1 rounded-full bg-ink-50 px-2 py-0.5 text-xs font-semibold text-ink">{u.role}</span>
          </p>
          <p className="text-xs text-muted">{u.email}</p>
          {u.phone && <p className="text-xs text-muted">{u.phone}</p>}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (u) => <span className="whitespace-nowrap text-muted">{relativeTime(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => resetPassword(u)}
            disabled={resetting === u.id}
            className="rounded-card border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-base disabled:opacity-50"
          >
            {resetting === u.id ? '...' : 'Reset Password'}
          </button>
          <button
            onClick={() => toggleActive(u)}
            className={`rounded-card px-3 py-1.5 text-sm font-medium ${
              u.isActive
                ? 'border border-chili text-chili hover:bg-chili-50'
                : 'bg-marigold text-ink hover:bg-marigold-600'
            }`}
          >
            {u.isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={exportContacts} className="rounded-card bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700">
          Export to Excel
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name or email..."
          className="w-56 rounded-card border border-line px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-card border border-line px-3 py-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r || 'All roles'}
            </option>
          ))}
        </select>
      </div>

      {actionError && <p className="mb-4 rounded-card bg-chili-50 px-4 py-2 text-sm text-chili-600">{actionError}</p>}

      {resetResult && (
        <div className="mb-4 rounded-card bg-marigold-50 p-4 text-sm">
          <p className="font-semibold text-ink">Password reset for {resetResult.email}</p>
          <p className="mt-1">
            New temporary password: <code className="rounded bg-white px-2 py-1 font-mono">{resetResult.temporaryPassword}</code>
          </p>
          <p className="mt-1 text-xs text-muted">Share this securely {'\u2014'} it won't be shown again.</p>
          <button onClick={() => setResetResult(null)} className="mt-2 text-xs font-semibold text-marigold-600">
            Dismiss
          </button>
        </div>
      )}

      <AdminDataTable
        columns={columns}
        rows={users}
        getRowId={(u) => u.id}
        loading={loading}
        error={error}
        onRetry={load}
        emptyMessage="No users match this filter."
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <AdminUsersContent />
    </Suspense>
  );
}
