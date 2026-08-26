'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { formatPriceCents } from '@/lib/api';
import { ManagementCenter } from '@/components/ManagementCenter';

interface AdminSummary {
  totalUsers: number;
  totalVendors: number;
  pendingVendors: number;
  totalProducts: number;
  pendingProducts: number;
  totalOrders: number;
  totalRevenueCents: number;
}

interface Access {
  isFullAccess: boolean;
  roleName: string;
  roleDescription?: string | null;
  permissions: string[];
}

export default function AdminDashboardPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [access, setAccess] = useState<Access | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!user) return;
    authFetch('/admin/me/access')
      .then((res) => {
        if (res.status === 403) {
          setForbidden(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setAccess(data);
      });
  }, [user, authFetch]);

  useEffect(() => {
    if (!user || !access?.isFullAccess) return;
    authFetch('/admin/dashboard/summary').then(async (res) => {
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      setSummary(await res.json());
    });
  }, [user, access, authFetch]);

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

  // Scoped management account — personalized, permission-driven view.
  if (!access.isFullAccess) {
    return <ManagementCenter access={access} />;
  }

  // Super Admin / legacy full-access admin — the full command center.
  if (!summary) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Customers', value: summary.totalUsers },
          { label: 'Approved Vendors', value: summary.totalVendors },
          { label: 'Pending Vendors', value: summary.pendingVendors },
          { label: 'Live Products', value: summary.totalProducts },
          { label: 'Pending Products', value: summary.pendingProducts },
          { label: 'Total Orders', value: summary.totalOrders },
          { label: 'Total Revenue', value: formatPriceCents(summary.totalRevenueCents) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-card bg-surface p-4 shadow-card">
            <p className="text-xs text-muted">{stat.label}</p>
            <p className="price-tag mt-1 text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/vendors" className="rounded-card bg-surface p-5 shadow-card hover:shadow-cardHover">
          <p className="font-semibold">🏪 Vendor Approvals</p>
          <p className="text-sm text-muted">{summary.pendingVendors} pending review</p>
        </Link>
        <Link href="/admin/products" className="rounded-card bg-surface p-5 shadow-card hover:shadow-cardHover">
          <p className="font-semibold">📦 Product Approvals</p>
          <p className="text-sm text-muted">{summary.pendingProducts} pending review</p>
        </Link>
        <Link href="/admin/users" className="rounded-card bg-surface p-5 shadow-card hover:shadow-cardHover">
          <p className="font-semibold">👤 User Management</p>
          <p className="text-sm text-muted">View and manage customer accounts</p>
        </Link>
        <Link href="/admin/categories" className="rounded-card bg-surface p-5 shadow-card hover:shadow-cardHover">
          <p className="font-semibold">🗂️ Categories</p>
          <p className="text-sm text-muted">Manage the storefront category tree</p>
        </Link>
        <Link href="/admin/announcements" className="rounded-card bg-surface p-5 shadow-card hover:shadow-cardHover">
          <p className="font-semibold">📣 Announcements</p>
          <p className="text-sm text-muted">Post site-wide banners and promos</p>
        </Link>
        <Link href="/admin/messages" className="rounded-card bg-surface p-5 shadow-card hover:shadow-cardHover">
          <p className="font-semibold">💬 Messages</p>
          <p className="text-sm text-muted">Vendor & customer conversations</p>
        </Link>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-ink-700">Team &amp; Governance</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/management" className="rounded-card bg-surface p-5 shadow-card hover:shadow-cardHover">
          <p className="font-semibold">🧑‍💼 Management Team</p>
          <p className="text-sm text-muted">Create accounts and assign duties</p>
        </Link>
        <Link href="/admin/roles" className="rounded-card bg-surface p-5 shadow-card hover:shadow-cardHover">
          <p className="font-semibold">🔐 Roles &amp; Permissions</p>
          <p className="text-sm text-muted">Define what each role can access</p>
        </Link>
        <Link href="/admin/audit-log" className="rounded-card bg-surface p-5 shadow-card hover:shadow-cardHover">
          <p className="font-semibold">📜 Audit Log</p>
          <p className="text-sm text-muted">Review sensitive admin actions</p>
        </Link>
      </div>
    </div>
  );
}
