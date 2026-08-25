// Mirrors the backend AdminPermission enum exactly (prisma/schema.prisma).
// Grouped by category for rendering role-editor checkboxes and for mapping
// a scoped admin's permissions to the sections of their personalized
// dashboard. Each entry's `route` is where that permission's real data
// lives — used to build "Requires Attention" / quick actions dynamically.

export interface PermissionDef {
  key: string;
  label: string;
  route?: string;
}

export interface PermissionCategory {
  label: string;
  icon: string;
  permissions: PermissionDef[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    label: 'Vendors',
    icon: '🏪',
    permissions: [
      { key: 'VIEW_VENDORS', label: 'View Vendors', route: '/admin/vendors' },
      { key: 'APPROVE_VENDORS', label: 'Approve Vendors' },
      { key: 'REJECT_VENDORS', label: 'Reject Vendors' },
      { key: 'MANAGE_VENDOR_COMMISSION', label: 'Manage Vendor Commission' },
      { key: 'VIEW_VENDOR_CHANGE_REQUESTS', label: 'View Vendor Change Requests', route: '/admin/vendors/change-requests' },
      { key: 'EDIT_VENDOR_REGISTRATION_INFO', label: 'Edit Vendor Registration Info' },
    ],
  },
  {
    label: 'Users',
    icon: '👤',
    permissions: [
      { key: 'VIEW_USERS', label: 'View Users', route: '/admin/users' },
      { key: 'EXPORT_USERS', label: 'Export Users' },
      { key: 'MANAGE_USER_STATUS', label: 'Activate / Deactivate Users' },
      { key: 'RESET_USER_PASSWORD', label: 'Reset User Passwords' },
    ],
  },
  {
    label: 'Products',
    icon: '📦',
    permissions: [
      { key: 'VIEW_PENDING_PRODUCTS', label: 'View Pending Products', route: '/admin/products' },
      { key: 'APPROVE_PRODUCTS', label: 'Approve Products' },
      { key: 'REJECT_PRODUCTS', label: 'Reject Products' },
    ],
  },
  {
    label: 'Storefront',
    icon: '🗂️',
    permissions: [
      { key: 'MANAGE_CATEGORIES', label: 'Manage Categories', route: '/admin/categories' },
      { key: 'MANAGE_PLATFORM_COUPONS', label: 'Manage Platform Coupons' },
    ],
  },
  {
    label: 'Content & Support',
    icon: '📣',
    permissions: [
      { key: 'VIEW_ANNOUNCEMENTS', label: 'View Announcements', route: '/admin/announcements' },
      { key: 'MANAGE_ANNOUNCEMENTS', label: 'Manage Announcements' },
      { key: 'MANAGE_SUPPORT_CONVERSATIONS', label: 'Manage Support Conversations', route: '/admin/messages' },
    ],
  },
  {
    label: 'System',
    icon: '⚙️',
    permissions: [
      { key: 'VIEW_ADMIN_DASHBOARD', label: 'View Admin Dashboard' },
      { key: 'MANAGE_SHIPMENTS', label: 'Manage Shipments' },
      { key: 'MANAGE_ADMIN_USERS', label: 'Manage Admin Users', route: '/admin/management' },
      { key: 'MANAGE_ROLES_PERMISSIONS', label: 'Manage Roles & Permissions', route: '/admin/roles' },
      { key: 'VIEW_AUDIT_LOGS', label: 'View Audit Log', route: '/admin/audit-log' },
    ],
  },
];

export const ALL_PERMISSIONS: PermissionDef[] = PERMISSION_CATEGORIES.flatMap((c) => c.permissions);

export function permissionLabel(key: string): string {
  return ALL_PERMISSIONS.find((p) => p.key === key)?.label ?? key;
}
