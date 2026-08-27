'use client';

import { createContext, useContext } from 'react';

export interface AdminAccess {
  isFullAccess: boolean;
  roleName: string;
  roleDescription?: string | null;
  permissions: string[];
}

const AdminAccessContext = createContext<AdminAccess | null>(null);

export function AdminAccessProvider({
  value,
  children,
}: {
  value: AdminAccess;
  children: React.ReactNode;
}) {
  return <AdminAccessContext.Provider value={value}>{children}</AdminAccessContext.Provider>;
}

export function useAdminAccess(): AdminAccess {
  const ctx = useContext(AdminAccessContext);
  if (!ctx) {
    throw new Error('useAdminAccess must be used within AdminAccessProvider (are you inside /admin?)');
  }
  return ctx;
}
