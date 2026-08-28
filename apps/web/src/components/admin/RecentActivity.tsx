'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface ActivityEntry {
  id: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  APPROVE_VENDOR: { label: 'Approved a vendor', icon: '\u2705' },
  REJECT_VENDOR: { label: 'Rejected a vendor', icon: '\u274c' },
  APPROVE_PRODUCT: { label: 'Approved a product', icon: '\u2705' },
  REJECT_PRODUCT: { label: 'Rejected a product', icon: '\u274c' },
  RESET_USER_PASSWORD: { label: 'Reset a user password', icon: '\ud83d\udd11' },
  REACTIVATE_USER: { label: 'Reactivated a user', icon: '\ud83d\udfe2' },
  DEACTIVATE_USER: { label: 'Deactivated a user', icon: '\ud83d\udd34' },
  CREATE_MANAGEMENT_USER: { label: 'Created a management account', icon: '\ud83e\uddd1\u200d\ud83d\udcbc' },
  REASSIGN_ROLE: { label: 'Reassigned a role', icon: '\ud83d\udd04' },
  SET_PERMISSION_OVERRIDE: { label: 'Updated a permission override', icon: '\ud83d\udd10' },
  REACTIVATE_MANAGEMENT_USER: { label: 'Reactivated a management account', icon: '\ud83d\udfe2' },
  SUSPEND_MANAGEMENT_USER: { label: 'Suspended a management account', icon: '\u23f8\ufe0f' },
};

function describe(entry: ActivityEntry): { label: string; icon: string } {
  return (
    ACTION_LABELS[entry.action] ?? {
      label: entry.action.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()),
      icon: '\ud83d\udd39',
    }
  );
}

function subtitle(entry: ActivityEntry): string | null {
  const d = entry.details ?? {};
  const name = (d.businessName ?? d.title ?? d.email ?? d.roleName) as string | undefined;
  return name ?? null;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-card bg-line ${className}`} />;
}

export function RecentActivity() {
  const { authFetch } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);

  useEffect(() => {
    authFetch('/admin/me/activity?limit=5')
      .then((res) => (res.ok ? res.json() : []))
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [authFetch]);

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Recent Activity</h2>
      {entries === null ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : entries.length === 0 ? (
        <p className="rounded-card bg-surface p-4 text-sm text-muted shadow-card">No recent activity yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map((entry) => {
            const { label, icon } = describe(entry);
            const sub = subtitle(entry);
            return (
              <li key={entry.id} className="flex items-center justify-between rounded-card bg-surface px-4 py-2.5 shadow-card">
                <span className="text-sm">
                  <span aria-hidden>{icon}</span> {label}
                  {sub && <span className="text-muted">{' \u2014 '}{sub}</span>}
                </span>
                <span className="whitespace-nowrap text-xs text-muted">{relativeTime(entry.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
