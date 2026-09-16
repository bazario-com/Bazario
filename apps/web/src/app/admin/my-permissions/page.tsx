'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PERMISSION_CATEGORIES } from '@/lib/admin-permissions';

interface MyAccess {
  isFullAccess: boolean;
  roleName: string;
  roleDescription?: string | null;
  permissions: string[];
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-card bg-line ${className}`} />;
}

export default function MyPermissionsPage() {
  const { authFetch, loading: authLoading } = useAuth();
  const [access, setAccess] = useState<MyAccess | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    authFetch('/admin/me/access')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setAccess)
      .catch(() => setError(true));
  }, [authLoading, authFetch]);

  if (authLoading) return null;

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="rounded-card bg-chili-50 p-4 text-sm text-chili-600">Unable to load your permissions.</p>
      </div>
    );
  }

  if (!access) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="mb-4 h-8 w-1/2" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">My Permissions</h1>
      <p className="mb-6 text-sm text-muted">What your account can see and do in the admin panel.</p>

      <div className="mb-8 rounded-card bg-surface p-5 shadow-card">
        <p className="text-lg font-semibold text-ink-900">{access.roleName}</p>
        {access.roleDescription && <p className="mt-1 text-sm text-muted">{access.roleDescription}</p>}
        {access.isFullAccess && (
          <p className="mt-2 inline-block rounded-full bg-marigold-50 px-3 py-1 text-xs font-semibold text-marigold-600">
            Full Access {'\u2014'} unrestricted
          </p>
        )}
      </div>

      {!access.isFullAccess && (
        <div className="space-y-6">
          {PERMISSION_CATEGORIES.map((category) => (
            <section key={category.label}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-700">
                <span aria-hidden>{category.icon}</span>
                {category.label}
              </h2>
              <ul className="space-y-1">
                {category.permissions.map((perm) => {
                  const granted = access.permissions.includes(perm.key);
                  return (
                    <li
                      key={perm.key}
                      className={`flex items-center gap-2 rounded-card px-3 py-2 text-sm shadow-card ${
                        granted ? 'bg-surface text-ink-900' : 'bg-base text-muted'
                      }`}
                    >
                      <span aria-hidden>{granted ? '\u2705' : '\u26aa'}</span>
                      {perm.label}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
