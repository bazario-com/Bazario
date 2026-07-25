'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { formatPriceCents } from '@/lib/api';

interface VendorSummary {
  totalRevenueCents: number;
  totalOrders: number;
  totalProducts: number;
  pendingApprovalProducts: number;
}

interface Vendor {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  businessName: string;
  rejectedReason?: string | null;
  store: { name: string; slug: string } | null;
}

export default function VendorDashboardPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [summary, setSummary] = useState<VendorSummary | null>(null);
  const [notVendor, setNotVendor] = useState(false);

  useEffect(() => {
    if (!user) return;
    authFetch('/vendors/me').then(async (res) => {
      if (res.status === 403) {
        setNotVendor(true);
        return;
      }
      setVendor(await res.json());
    });
  }, [user, authFetch]);

  useEffect(() => {
    if (!vendor || vendor.status !== 'APPROVED') return;
    authFetch('/vendors/me/dashboard')
      .then((res) => res.json())
      .then(setSummary);
  }, [vendor, authFetch]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Log in to access your vendor dashboard</h1>
        <Link href="/login" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink">
          Log in
        </Link>
      </div>
    );
  }

  if (notVendor) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">You're not registered as a vendor yet</h1>
        <Link href="/vendor/register" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink">
          Apply to sell on Bazaario
        </Link>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">{vendor.businessName}</h1>
      <p className="mb-6 text-sm text-muted">{vendor.store?.name}</p>

      {vendor.status === 'PENDING' && (
        <p className="mb-6 rounded-card bg-marigold-50 px-4 py-3 text-sm font-medium text-marigold-600">
          Your application is under review. You'll be able to list products once an admin approves your store.
        </p>
      )}
      {vendor.status === 'REJECTED' && (
        <p className="mb-6 rounded-card bg-chili-50 px-4 py-3 text-sm text-chili-600">
          Your application was not approved{vendor.rejectedReason ? `: ${vendor.rejectedReason}` : '.'}
        </p>
      )}
      {vendor.status === 'SUSPENDED' && (
        <p className="mb-6 rounded-card bg-chili-50 px-4 py-3 text-sm text-chili-600">
          Your store is currently suspended. Contact support for details.
        </p>
      )}

      {summary && (
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Total Revenue', value: formatPriceCents(summary.totalRevenueCents) },
            { label: 'Total Orders', value: summary.totalOrders },
            { label: 'Active Products', value: summary.totalProducts },
            { label: 'Pending Approval', value: summary.pendingApprovalProducts },
          ].map((stat) => (
            <div key={stat.label} className="rounded-card bg-surface p-4 shadow-card">
              <p className="text-xs text-muted">{stat.label}</p>
              <p className="price-tag mt-1 text-xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/vendor/dashboard/products" className="rounded-card bg-surface p-5 shadow-card hover:shadow-cardHover">
          <p className="font-semibold">📦 Manage Products</p>
          <p className="text-sm text-muted">Add, edit, and track your listings</p>
        </Link>
        <Link href="/vendor/dashboard/orders" className="rounded-card bg-surface p-5 shadow-card hover:shadow-cardHover">
          <p className="font-semibold">🚚 Manage Orders</p>
          <p className="text-sm text-muted">Process and fulfill customer orders</p>
        </Link>
      </div>
    </div>
  );
}
