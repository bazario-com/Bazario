'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const LINKS = [
  { href: '/orders', label: 'Order History', icon: '📦' },
  { href: '/wishlist', label: 'Wishlist', icon: '🤍' },
  { href: '/account/addresses', label: 'Saved Addresses', icon: '📍' },
];

const VENDOR_LINK = { href: '/vendor/dashboard', label: 'Vendor Dashboard', icon: '🏪' };
const ADMIN_LINK = { href: '/admin', label: 'Admin Dashboard', icon: '🛠️' };

export default function AccountPage() {
  const { user, logout, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Log in to view your account</h1>
        <Link href="/login" className="rounded-card bg-marigold px-6 py-3 font-semibold text-ink">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">
        {user.firstName} {user.lastName}
      </h1>
      <p className="mb-6 text-sm text-muted">{user.email}</p>

      <ul className="space-y-2">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card transition hover:shadow-cardHover"
            >
              <span className="text-xl">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </Link>
          </li>
        ))}
        {(user.role === 'VENDOR' ? [VENDOR_LINK] : []).map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card transition hover:shadow-cardHover"
            >
              <span className="text-xl">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </Link>
          </li>
        ))}
        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? [ADMIN_LINK] : []).map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card transition hover:shadow-cardHover"
            >
              <span className="text-xl">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </Link>
          </li>
        ))}
        {user.role === 'CUSTOMER' && (
          <li>
            <Link
              href="/vendor/register"
              className="flex items-center gap-3 rounded-card border border-dashed border-line p-4 text-muted transition hover:border-ink hover:text-ink"
            >
              <span className="text-xl">🏪</span>
              <span className="font-medium">Become a Vendor</span>
            </Link>
          </li>
        )}
      </ul>

      <button
        onClick={() => logout()}
        className="mt-6 text-sm text-muted hover:text-chili"
      >
        Log out
      </button>
    </div>
  );
}
