'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

// Grouped so future sections (Growth, Finance, Marketing) can slot in
// cleanly without restructuring — deliberately just two groups for now
// since those other sections aren't backed by real data yet.
const NAV_GROUPS = [
  {
    label: 'Business',
    links: [
      { href: '/vendor/dashboard', label: 'Dashboard', icon: '🏠' },
      { href: '/vendor/dashboard/orders', label: 'Orders', icon: '📦' },
      { href: '/vendor/dashboard/products', label: 'Products', icon: '🛍️' },
    ],
  },
  {
    label: 'Store',
    links: [
      { href: '/vendor/dashboard/reviews', label: 'Reviews', icon: '⭐' },
      { href: '/vendor/dashboard/store', label: 'Store Management', icon: '🏪' },
    ],
  },
];

const SYSTEM_LINKS = [{ href: '/help', label: 'Help & Support', icon: '💬' }];

export function VendorSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const allLinks = [...NAV_GROUPS.flatMap((g) => g.links), ...SYSTEM_LINKS];

  return (
    <>
      {/* Desktop: grouped fixed sidebar */}
      <nav className="hidden w-56 shrink-0 md:block" aria-label="Vendor navigation">
        <div className="sticky top-20 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.links.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition ${
                          active ? 'bg-marigold-50 text-marigold-600' : 'text-ink-700 hover:bg-base'
                        }`}
                      >
                        <span aria-hidden>{link.icon}</span>
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="border-t border-line pt-4">
            <ul className="space-y-1">
              {SYSTEM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-base"
                  >
                    <span aria-hidden>{link.icon}</span>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-base hover:text-chili"
                >
                  <span aria-hidden>🚪</span>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Mobile: horizontal scroll pill nav */}
      <nav className="-mx-4 mb-4 overflow-x-auto border-b border-line px-4 pb-3 md:hidden" aria-label="Vendor navigation">
        <ul className="flex w-max gap-2">
          {allLinks.map((link) => {
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
          <li>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-chili-50 px-3.5 py-2 text-xs font-semibold text-chili-600"
            >
              <span aria-hidden>🚪</span>
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
