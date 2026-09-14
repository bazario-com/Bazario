'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { describeAction, actionSubtitle } from '@/lib/admin-actions';
import { relativeTime } from '@/lib/format-time';

interface ActivityEntry {
  id: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
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
            const { label, icon } = describeAction(entry.action);
            const sub = actionSubtitle(entry.details);
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
