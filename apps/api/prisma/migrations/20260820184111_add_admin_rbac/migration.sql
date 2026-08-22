CREATE TYPE "AdminPermission" AS ENUM ('VIEW_VENDORS', 'APPROVE_VENDORS', 'REJECT_VENDORS', 'MANAGE_VENDOR_COMMISSION', 'VIEW_VENDOR_CHANGE_REQUESTS', 'EDIT_VENDOR_REGISTRATION_INFO', 'VIEW_USERS', 'EXPORT_USERS', 'MANAGE_USER_STATUS', 'RESET_USER_PASSWORD', 'VIEW_PENDING_PRODUCTS', 'APPROVE_PRODUCTS', 'REJECT_PRODUCTS', 'VIEW_ADMIN_DASHBOARD', 'VIEW_ANNOUNCEMENTS', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_CATEGORIES', 'MANAGE_PLATFORM_COUPONS', 'MANAGE_SUPPORT_CONVERSATIONS', 'MANAGE_SHIPMENTS', 'MANAGE_ADMIN_USERS', 'MANAGE_ROLES_PERMISSIONS', 'VIEW_AUDIT_LOGS');

CREATE TABLE "admin_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_roles_name_key" ON "admin_roles"("name");

CREATE TABLE "admin_role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permission" "AdminPermission" NOT NULL,

    CONSTRAINT "admin_role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_role_permissions_roleId_permission_key" ON "admin_role_permissions"("roleId", "permission");

CREATE TABLE "admin_role_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_role_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_role_assignments_userId_key" ON "admin_role_assignments"("userId");

CREATE TABLE "admin_permission_overrides" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "AdminPermission" NOT NULL,
    "granted" BOOLEAN NOT NULL,

    CONSTRAINT "admin_permission_overrides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_permission_overrides_userId_permission_key" ON "admin_permission_overrides"("userId", "permission");

CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_actorId_idx" ON "admin_audit_logs"("actorId");

CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");

ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "admin_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_role_assignments" ADD CONSTRAINT "admin_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_role_assignments" ADD CONSTRAINT "admin_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "admin_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "admin_permission_overrides" ADD CONSTRAINT "admin_permission_overrides_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
