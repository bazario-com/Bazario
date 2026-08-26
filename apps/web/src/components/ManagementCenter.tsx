'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface Access {
  roleName: string;
  roleDescription?: string | null;
  permissions: string[];
}

interface AttentionItem {
  label: string;
  href: string;
  icon: string;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-card bg-line ${className}`} />;
}

export function ManagementCenter({ access }: { access: Access }) {
  const { user, authFetch } = useAuth();
  const has = (p: string) => access.permissions.includes(p);

  const [pendingVendors, setPendingVendors] = useState<number | null>(null);
  const [pendingChangeRequests, setPendingChangeRequests] = useState<number | null>(null);
  const [pendingProducts, setPendingProducts] = useState<number | null>(null);

  useEffect(() => {
    if (has('VIEW_VENDORS')) {
      authFetch('/admin/vendors?status=PENDING')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setPendingVendors(data.length))
        .catch(() => setPendingVendors(0));
    }
    if (has('VIEW_VENDOR_CHANGE_REQUESTS')) {
      authFetch('/admin/vendors/change-requests?status=PENDING')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setPendingChangeRequests(data.length))
        .catch(() => setPendingChangeRequests(0));
    }
    if (has('VIEW_PENDING_PRODUCTS')) {
      authFetch('/admin/products?status=PENDING_APPROVAL')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setPendingProducts(data.length))
        .catch(() => setPendingProducts(0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attentionItems: AttentionItem[] = [];
  if (pendingVendors) {
    attentionItems.push({
      label: `${pendingVendors} vendor application${pendingVendors !== 1 ? 's' : ''} awaiting review`,
      href: '/admin/vendors',
      icon: '🔴',
    });
  }
  if (pendingChangeRequests) {
    attentionItems.push({
      label: `${pendingChangeRequests} vendor info change request${pendingChangeRequests !== 1 ? 's' : ''}`,
      href: '/admin/vendors/change-requests',
      icon: '🟠',
    });
  }
  if (pendingProducts) {
    attentionItems.push({
      label: `${pendingProducts} product${pendingProducts !== 1 ? 's' : ''} awaiting approval`,
      href: '/admin/products',
      icon: '🟡',
    });
  }

  const quickActions: { label: string; href: string; icon: string; show: boolean }[] = [
    { label: 'Vendor Applications', href: '/admin/vendors', icon: '🏪', show: has('VIEW_VENDORS') },
    { label: 'Change Requests', href: '/admin/vendors/change-requests', icon: '📝', show: has('VIEW_VENDOR_CHANGE_REQUESTS') },
    { label: 'Product Approvals', href: '/admin/products', icon: '📦', show: has('VIEW_PENDING_PRODUCTS') },
    { label: 'Users', href: '/admin/users', icon: '👤', show: has('VIEW_USERS') },
    { label: 'Categories', href: '/admin/categories', icon: '🗂️', show: has('MANAGE_CATEGORIES') },
    { label: 'Announcements', href: '/admin/announcements', icon: '📣', show: has('VIEW_ANNOUNCEMENTS') },
    { label: 'Messages', href: '/admin/messages', icon: '💬', show: has('MANAGE_SUPPORT_CONVERSATIONS') },
  ].filter((a) => a.show);

  const loadingAttention =
    (has('VIEW_VENDORS') && pendingVendors === null) ||
    (has('VIEW_VENDOR_CHANGE_REQUESTS') && pendingChangeRequests === null) ||
    (has('VIEW_PENDING_PRODUCTS') && pendingProducts === null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm text-muted">Good to see you, {user?.firstName}.</p>
      <h1 className="mb-1 text-2xl font-bold">{access.roleName}</h1>
      {access.roleDescription && <p className="mb-6 text-sm text-muted">{access.roleDescription}</p>}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Requires Your Attention</h2>
        {loadingAttention ? (
          <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : attentionItems.length === 0 ? (
          <p className="rounded-card bg-marigold-50 p-4 text-sm text-marigold-600">
            🟢 You're all caught up — nothing needs your attention right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {attentionItems.map((item) => (
              <li key={item.href + item.label}>
                <Link href={item.href} className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card hover:shadow-cardHover">
                  <span>{item.icon} {item.label}</span>
                  <span className="text-sm font-semibold text-marigold-600">Review →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {quickActions.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">My Work</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-card bg-surface p-4 text-center shadow-card hover:shadow-cardHover"
              >
                <span className="text-xl">{action.icon}</span>
                <p className="mt-1 text-sm font-semibold">{action.label}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
