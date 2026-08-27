export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  permission: string | null; // null = always visible (e.g. Dashboard)
}

export interface AdminNavSection {
  title: string | null;
  items: AdminNavItem[];
}

// Mapped to the 22 real AdminPermission enum values and the admin pages
// that actually exist today. Orders/Finance/Moderation sections from the
// original spec are intentionally omitted — no backend permission or page
// exists for them yet.
export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: null,
    items: [{ label: 'Dashboard', href: '/admin', icon: '\ud83c\udfe0', permission: null }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Vendors', href: '/admin/vendors', icon: '\ud83c\udfea', permission: 'VIEW_VENDORS' },
      { label: 'Products', href: '/admin/products', icon: '\ud83d\udce6', permission: 'VIEW_PENDING_PRODUCTS' },
      { label: 'Customers', href: '/admin/users', icon: '\ud83d\udc64', permission: 'VIEW_USERS' },
      { label: 'Categories', href: '/admin/categories', icon: '\ud83d\uddc2\ufe0f', permission: 'MANAGE_CATEGORIES' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { label: 'Announcements', href: '/admin/announcements', icon: '\ud83d\udce3', permission: 'VIEW_ANNOUNCEMENTS' },
      { label: 'Messages', href: '/admin/messages', icon: '\ud83d\udcac', permission: 'MANAGE_SUPPORT_CONVERSATIONS' },
    ],
  },
  {
    title: 'Team & Governance',
    items: [
      { label: 'Management Team', href: '/admin/management', icon: '\ud83e\uddd1\u200d\ud83d\udcbc', permission: 'MANAGE_ADMIN_USERS' },
      { label: 'Roles & Permissions', href: '/admin/roles', icon: '\ud83d\udd10', permission: 'MANAGE_ROLES_PERMISSIONS' },
      { label: 'Audit Log', href: '/admin/audit-log', icon: '\ud83d\udcdc', permission: 'VIEW_AUDIT_LOGS' },
    ],
  },
];

export function filterNavForAccess(
  access: { isFullAccess: boolean; permissions: string[] } | null
): AdminNavSection[] {
  if (!access) return [];
  return ADMIN_NAV.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        item.permission === null ||
        access.isFullAccess ||
        access.permissions.includes(item.permission)
    ),
  })).filter((section) => section.items.length > 0);
}
