'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AdminDataTable, type Column } from '@/components/admin/AdminDataTable';
import { describeAction, actionSubtitle } from '@/lib/admin-actions';
import { relativeTime } from '@/lib/format-time';

interface AuditEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  actor: { firstName: string; lastName: string; email: string };
}

const PAGE_SIZE = 30;

export default function AdminAuditLogPage() {
  const { authFetch, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
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
        if (data) {
          setEntries(data.entries);
          setTotal(data.total);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
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

  const columns: Column<AuditEntry>[] = [
    {
      key: 'actor',
      header: 'Who',
      render: (entry) => (
        <span className="font-semibold">
          {entry.actor.firstName} {entry.actor.lastName}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (entry) => {
        const { label, icon } = describeAction(entry.action);
        const sub = actionSubtitle(entry.details);
        return (
          <span>
            <span aria-hidden>{icon}</span> {label}
            {sub && <span className="text-muted"> {'\u2014'} {sub}</span>}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'When',
      render: (entry) => <span className="whitespace-nowrap text-muted">{relativeTime(entry.createdAt)}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Audit Log</h1>
      <p className="mb-6 text-sm text-muted">A record of sensitive administrative actions.</p>

      <AdminDataTable
        columns={columns}
        rows={entries}
        getRowId={(entry) => entry.id}
        loading={loading}
        error={error}
        onRetry={load}
        emptyMessage="No administrative actions recorded yet."
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        renderDrawer={(entry, onClose) => (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
            onClick={onClose}
          >
            <div
              className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-card bg-surface p-6 shadow-card sm:rounded-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between">
                <h2 className="text-lg font-bold">Action Details</h2>
                <button onClick={onClose} className="text-muted hover:text-ink-900">
                  Close
                </button>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Actor</dt>
                  <dd>
                    {entry.actor.firstName} {entry.actor.lastName} ({entry.actor.email})
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Action</dt>
                  <dd>{describeAction(entry.action).label}</dd>
                </div>
                {entry.targetType && (
                  <div>
                    <dt className="text-muted">Target</dt>
                    <dd>
                      {entry.targetType} {entry.targetId ? `(${entry.targetId})` : ''}
                    </dd>
                  </div>
                )}
                {entry.details && Object.keys(entry.details).length > 0 && (
                  <div>
                    <dt className="text-muted">Details</dt>
                    <dd className="space-y-1">
                      {Object.entries(entry.details).map(([k, v]) => (
                        <div key={k}>
                          <span className="font-semibold">{k}:</span> {String(v)}
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted">Time</dt>
                  <dd>{new Date(entry.createdAt).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      />
    </div>
  );
}
