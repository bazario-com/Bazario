'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AdminShell } from '@/components/admin/AdminShell';

interface Access {
  isFullAccess: boolean;
  roleName: string;
  roleDescription?: string | null;
  permissions: string[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [access, setAccess] = useState<Access | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!user) return;
    authFetch('/admin/me/access')
      .then((res) => {
        if (res.status === 403) {
          setForbidden(true);
          return null;
        }
        if (!res.ok) {
          throw new Error(`access fetch failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) setAccess(data);
      })
      .catch(() => setForbidden(true));
  }, [user, authFetch]);

  if (authLoading) return null;
  if (!user) return null;

  if (forbidden) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Admin access required</h1>
      </div>
    );
  }

  if (!access) return null;

  return (
    <AdminShell access={access} user={user}>
      {children}
    </AdminShell>
  );
}
