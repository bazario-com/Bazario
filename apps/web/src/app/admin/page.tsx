'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { formatPriceCents } from '@/lib/api';

interface AdminSummary {
  totalUsers: number;
  totalVendors: number;
  pendingVendors: number;
  totalProducts: number;
  pendingProducts: number;
  totalOrders: number;
  totalRevenueCents: number;
}

export default function AdminDashboardPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!user) return;
    authFetch('/admin/dashboard/summary').then(async (res) => {
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      setSummary(await res.json());
    });
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
      </div>
    </div>
  );
}
