'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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

interface SearchResult {
  type: 'vendor' | 'product' | 'user';
  id: string;
  label: string;
  subtitle?: string;
  href: string;
}

interface NotificationItem {
  type: string;
  count: number;
  label: string;
  href: string;
  icon: string;
}

const ICON_HOME = '\ud83c\udfe0';
const ICON_MENU = '\u2630';
const ICON_CLOSE = '\u2715';
const ICON_BELL = '\ud83d\udd14';
const ICON_COLLAPSE = '\u00ab';
const ICON_EXPAND = '\u00bb';
const SEARCH_MIN_LENGTH = 2;

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
  const router = useRouter();
  const { authFetch } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const sections = filterNavForAccess(access);
  const initial = user.firstName?.[0]?.toUpperCase() ?? '?';

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  useEffect(() => {
    if (searchQuery.trim().length < SEARCH_MIN_LENGTH) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      authFetch(`/admin/me/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((data) => setSearchResults(data.results))
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, authFetch]);

  useEffect(() => {
    authFetch('/admin/me/notifications')
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setNotifications(data.items))
      .catch(() => setNotifications([]));
  }, [authFetch]);

  const goToResult = (href: string) => {
    router.push(href);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const totalNotifCount = (notifications ?? []).reduce((sum, n) => sum + n.count, 0);

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
      <div className={`flex min-h-screen flex-col transition-all ${collapsed ? 'md:pl-16' : 'md:pl-60'}`}>
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

          <div className="relative hidden flex-1 items-center md:flex">
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search vendors, products, users..."
              className="w-full max-w-sm rounded-card border border-line bg-base px-3 py-1.5 text-sm text-ink-900"
            />
            {searchOpen && searchQuery.trim().length >= SEARCH_MIN_LENGTH && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSearchOpen(false)} />
                <div className="absolute left-0 top-full z-40 mt-1 w-full max-w-sm rounded-card border border-line bg-surface shadow-card">
                  {searchResults.length === 0 ? (
                    <p className="p-3 text-sm text-muted">No matches.</p>
                  ) : (
                    <ul className="max-h-80 overflow-y-auto py-1">
                      {searchResults.map((r) => (
                        <li key={`${r.type}-${r.id}`}>
                          <button
                            onClick={() => goToResult(r.href)}
                            className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-base"
                          >
                            <span className="font-medium text-ink-900">{r.label}</span>
                            {r.subtitle && <span className="text-xs text-muted">{r.subtitle}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
                className="relative rounded-card p-1.5 text-ink hover:bg-ink-50"
              >
                {ICON_BELL}
                {totalNotifCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-chili px-1 text-[10px] font-bold text-white">
                    {totalNotifCount > 9 ? '9+' : totalNotifCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full z-40 mt-1 w-72 rounded-card border border-line bg-surface shadow-card">
                    <p className="border-b border-line px-3 py-2 text-sm font-semibold text-ink-900">Notifications</p>
                    {notifications === null ? (
                      <p className="p-3 text-sm text-muted">Loading{'\u2026'}</p>
                    ) : notifications.length === 0 ? (
                      <p className="p-3 text-sm text-muted">You're all caught up.</p>
                    ) : (
                      <ul>
                        {notifications.map((n) => (
                          <li key={n.type}>
                            <Link
                              href={n.href}
                              onClick={() => setNotifOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-base"
                            >
                              <span aria-hidden>{n.icon}</span>
                              <span className="text-ink-900">{n.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
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
