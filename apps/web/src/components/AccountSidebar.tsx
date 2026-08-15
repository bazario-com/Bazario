'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/account', label: 'Dashboard', icon: '🏠' },
  { href: '/orders', label: 'My Orders', icon: '📦' },
  { href: '/wishlist', label: 'Wishlist', icon: '🤍' },
  { href: '/account/following', label: 'Following Stores', icon: '🏪' },
  { href: '/account/coupons', label: 'Coupons', icon: '🎟️' },
  { href: '/account/rewards', label: 'Rewards', icon: '🎁' },
  { href: '/account/addresses', label: 'Addresses', icon: '📍' },
  { href: '/help', label: 'Help & Support', icon: '💬' },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <nav className="hidden w-56 shrink-0 md:block" aria-label="Account navigation">
        <ul className="sticky top-20 space-y-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-marigold-50 text-marigold-600'
                      : 'text-ink-700 hover:bg-base'
                  }`}
                >
                  <span aria-hidden>{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile: horizontal scroll pill nav */}
      <nav
        className="-mx-4 mb-4 overflow-x-auto border-b border-line px-4 pb-3 md:hidden"
        aria-label="Account navigation"
      >
        <ul className="flex w-max gap-2">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    active ? 'bg-ink-700 text-white' : 'bg-base text-ink-700'
                  }`}
                >
                  <span aria-hidden>{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
