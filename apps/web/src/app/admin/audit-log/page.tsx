'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface AuditEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  actor: { firstName: string; lastName: string; email: string };
}

const ACTION_LABELS: Record<string, string> = {
  APPROVE_VENDOR: 'Approved vendor',
  REJECT_VENDOR: 'Rejected vendor',
  RESET_USER_PASSWORD: "Reset a user's password",
  REACTIVATE_USER: 'Reactivated a user',
  DEACTIVATE_USER: 'Deactivated a user',
  CREATE_MANAGEMENT_USER: 'Created a management account',
  REASSIGN_ROLE: "Reassigned a team member's role",
  SET_PERMISSION_OVERRIDE: 'Set a permission override',
  REACTIVATE_MANAGEMENT_USER: 'Reactivated a management account',
  SUSPEND_MANAGEMENT_USER: 'Suspended a management account',
};

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-card bg-line ${className}`} />;
}

export default function AdminAuditLogPage() {
  const { authFetch, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setForbidden(false);
    authFetch(`/admin/audit-log?page=${page}`)
      .then((res) => {
        if (res.status === 403) {
          setForbidden(true);
          return null;
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data) setEntries(data);
      })
      .catch(() => setError(true));
  }, [authFetch, page]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  if (authLoading) return null;

  if (forbidden) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">You don't have access to the audit log</h1>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Audit Log</h1>
      <p className="mb-6 text-sm text-muted">A record of sensitive administrative actions.</p>

      {error ? (
        <div className="rounded-card bg-chili-50 p-4 text-center text-sm text-chili-600">
          <p className="mb-2">Unable to load the audit log.</p>
          <button onClick={load} className="rounded-card border border-chili px-4 py-1.5 font-semibold hover:bg-chili hover:text-white">
            Try Again
          </button>
        </div>
      ) : entries === null ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : entries.length === 0 ? (
        <p className="rounded-card bg-surface p-8 text-center text-sm text-muted shadow-card">
          No administrative actions recorded yet.
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-card bg-surface p-4 shadow-card">
                <p className="text-sm">
                  <span className="font-semibold">{entry.actor.firstName} {entry.actor.lastName}</span>{' '}
                  <span className="text-ink-400">{ACTION_LABELS[entry.action] ?? entry.action}</span>
                </p>
                {entry.details && Object.keys(entry.details).length > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    {Object.entries(entry.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted">{new Date(entry.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-card border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-muted">Page {page}</span>
            <button
              disabled={entries.length < 30}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-card border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
