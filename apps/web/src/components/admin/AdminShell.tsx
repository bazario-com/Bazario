'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { filterNavForAccess } from '@/lib/admin-nav';

interface Access {
  isFullAccess: boolean;
  roleName: string;
  roleDescription?: string | null;
  permissions: string[];
}

interface ShellUser {
  email: string;
  firstName: string;
  lastName: string;
}

const ICON_HOME = '\ud83c\udfe0';
const ICON_MENU = '\u2630';
const ICON_CLOSE = '\u2715';
const ICON_BELL = '\ud83d\udd14';
const ICON_COLLAPSE = '\u00ab';
const ICON_EXPAND = '\u00bb';

export function AdminShell({
  access,
  user,
  children,
}: {
  access: Access;
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sections = filterNavForAccess(access);
  const initial = user.firstName?.[0]?.toUpperCase() ?? '?';

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {sections.map((section, i) => (
        <div key={i}>
          {section.title && (
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-ink-100/70">
              {section.title}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-card px-2.5 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-marigold text-ink-900'
                    : 'text-ink-50 hover:bg-ink-700'
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-base">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col bg-ink text-white transition-all md:flex ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink-700 px-3 py-4">
          {!collapsed && <span className="font-display text-lg font-bold">Shopina</span>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-card p-1.5 text-ink-50 hover:bg-ink-700"
          >
            {collapsed ? ICON_EXPAND : ICON_COLLAPSE}
          </button>
        </div>
        <NavLinks />
        <div className="border-t border-ink-700 px-3 py-3">
          {!collapsed && (
            <>
              <p className="truncate text-sm font-semibold text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-ink-100/70">{access.roleName}</p>
            </>
          )}
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink text-white">
            <div className="flex items-center justify-between border-b border-ink-700 px-4 py-4">
              <span className="font-display text-lg font-bold">Shopina</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-card p-1.5 text-ink-50 hover:bg-ink-700"
              >
                {ICON_CLOSE}
              </button>
            </div>
            <NavLinks onNavigate={() => setDrawerOpen(false)} />
            <div className="border-t border-ink-700 px-4 py-3">
              <p className="truncate text-sm font-semibold text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-ink-100/70">{access.roleName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className={`flex min-h-screen flex-col transition-all md:${collapsed ? 'pl-16' : 'pl-60'}`}>
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-card p-1.5 text-ink hover:bg-ink-50 md:hidden"
          >
            {ICON_MENU}
          </button>
          <span className="font-display font-bold text-ink md:hidden">Shopina Management</span>

          <div className="hidden flex-1 items-center md:flex">
            <input
              disabled
              placeholder={`Global search \u2014 coming soon`}
              className="w-full max-w-sm rounded-card border border-line bg-base px-3 py-1.5 text-sm text-muted"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              disabled
              aria-label="Notifications (coming soon)"
              title={`Notifications \u2014 coming soon`}
              className="rounded-card p-1.5 text-line"
            >
              {ICON_BELL}
            </button>
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-ink-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted">{access.roleName}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
              {initial}
            </div>
          </div>
        </header>

        <main className="flex-1 pb-16 md:pb-0">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface md:hidden">
          <Link
            href="/admin"
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
              pathname === '/admin' ? 'text-ink' : 'text-muted'
            }`}
          >
            <span aria-hidden>{ICON_HOME}</span>
            Home
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium text-muted"
          >
            <span aria-hidden>{ICON_MENU}</span>
            More
          </button>
        </nav>
      </div>
    </div>
  );
}
