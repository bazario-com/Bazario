'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface AdminRole {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  adminRoleAssignment: { role: { name: string } } | null;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-card bg-line ${className}`} />;
}

export default function AdminManagementPage() {
  const { authFetch, loading: authLoading } = useAuth();
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [error, setError] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', roleId: '' });
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; temporaryPassword: string } | null>(null);

  const [reassigning, setReassigning] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(false);
    setForbidden(false);
    authFetch('/admin/management')
      .then((res) => {
        if (res.status === 403) {
          setForbidden(true);
          return null;
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data) setTeam(data);
      })
      .catch(() => setError(true));

    authFetch('/admin/roles')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRoles(data.map((r: any) => ({ id: r.id, name: r.name }))))
      .catch(() => {});
  }, [authFetch]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormMsg(null);
    try {
      const res = await authFetch('/admin/management', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Could not create account');
      setCreatedCreds({ email: data.email, temporaryPassword: data.temporaryPassword });
      setShowForm(false);
      setForm({ email: '', firstName: '', lastName: '', roleId: '' });
      load();
    } catch (err) {
      setFormMsg(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleReassign = async (userId: string, roleId: string) => {
    setReassigning(userId);
    try {
      await authFetch(`/admin/management/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ roleId }) });
      load();
    } finally {
      setReassigning(null);
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    const action = member.isActive ? 'suspend' : 'reactivate';
    if (!confirm(`${action === 'suspend' ? 'Suspend' : 'Reactivate'} ${member.firstName} ${member.lastName}?`)) return;
    await authFetch(`/admin/management/${member.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    load();
  };

  if (authLoading) return null;

  if (forbidden) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Only the Super Admin can manage the team</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Management Team</h1>
          <p className="text-sm text-muted">Create accounts and assign duties for your team.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setCreatedCreds(null); }}
          disabled={roles.length === 0}
          className="rounded-card bg-marigold px-5 py-2.5 font-semibold text-ink hover:bg-marigold-600 disabled:opacity-50"
        >
          + Add Team Member
        </button>
      </div>

      {roles.length === 0 && (
        <p className="mb-6 rounded-card bg-marigold-50 p-4 text-sm text-marigold-600">
          Create a role first (Roles &amp; Permissions) before adding team members.
        </p>
      )}

      {createdCreds && (
        <div className="mb-6 rounded-card bg-marigold-50 p-4 text-sm">
          <p className="font-semibold text-ink">Account created for {createdCreds.email}</p>
          <p className="mt-1">
            Temporary password: <code className="rounded bg-white px-2 py-1 font-mono">{createdCreds.temporaryPassword}</code>
          </p>
          <p className="mt-1 text-xs text-muted">Share this securely — it won't be shown again.</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 space-y-4 rounded-card bg-surface p-5 shadow-card">
          <h2 className="font-semibold">New Team Member</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="rounded-card border border-line px-4 py-2.5"
            />
            <input
              required
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="rounded-card border border-line px-4 py-2.5"
            />
          </div>
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-card border border-line px-4 py-2.5"
          />
          <select
            required
            value={form.roleId}
            onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
            className="w-full rounded-card border border-line px-4 py-2.5"
          >
            <option value="">Select a role…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {formMsg && <p className="text-sm text-chili">{formMsg}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-card bg-marigold px-5 py-2.5 font-semibold text-ink hover:bg-marigold-600 disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create Account'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-card border border-line px-5 py-2.5">
              Cancel
            </button>
          </div>
        </form>
      )}

      {error ? (
        <div className="rounded-card bg-chili-50 p-4 text-center text-sm text-chili-600">
          <p className="mb-2">Unable to load the team.</p>
          <button onClick={load} className="rounded-card border border-chili px-4 py-1.5 font-semibold hover:bg-chili hover:text-white">
            Try Again
          </button>
        </div>
      ) : team === null ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <ul className="space-y-2">
          {team.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-card">
              <div>
                <p className="font-medium">
                  {member.firstName} {member.lastName}{' '}
                  <span className="ml-1 rounded-full bg-ink-50 px-2 py-0.5 text-xs font-semibold text-ink">
                    {member.role === 'SUPER_ADMIN' ? 'Super Admin' : member.adminRoleAssignment?.role.name ?? 'Full Access'}
                  </span>
                  {!member.isActive && (
                    <span className="ml-1 rounded-full bg-chili-50 px-2 py-0.5 text-xs font-semibold text-chili-600">Suspended</span>
                  )}
                </p>
                <p className="text-sm text-muted">{member.email}</p>
              </div>

              {member.role !== 'SUPER_ADMIN' && (
                <div className="flex items-center gap-2">
                  <select
                    value=""
                    disabled={reassigning === member.id}
                    onChange={(e) => e.target.value && handleReassign(member.id, e.target.value)}
                    className="rounded-card border border-line px-2 py-1.5 text-sm"
                  >
                    <option value="">Reassign role…</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleToggleStatus(member)}
                    className={`rounded-card px-3 py-1.5 text-sm font-medium ${
                      member.isActive ? 'border border-chili text-chili hover:bg-chili-50' : 'bg-marigold text-ink hover:bg-marigold-600'
                    }`}
                  >
                    {member.isActive ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
