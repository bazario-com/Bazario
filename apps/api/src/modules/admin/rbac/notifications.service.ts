import { Injectable } from '@nestjs/common';
import { AdminPermission } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermissionsService, FULL_ACCESS } from './permissions.service';

export interface NotificationItem {
  type: string;
  count: number;
  label: string;
  href: string;
  icon: string;
}

// Computed, not persisted — every item here reflects real pending records
// queried live, scoped to what this admin is actually permitted to see.
// No read/unread state; the badge count is just "how many pending items
// exist right now", same honesty rule as the rest of the admin panel.
@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async getNotifications(userId: string, role: string): Promise<{ items: NotificationItem[] }> {
    const effective = await this.permissionsService.getEffectivePermissions(userId, role);
    const has = (p: AdminPermission) => effective === FULL_ACCESS || effective.has(p);
    const items: NotificationItem[] = [];

    if (has('VIEW_VENDORS' as AdminPermission)) {
      const count = await this.prisma.vendor.count({ where: { status: 'PENDING' } });
      if (count > 0) {
        items.push({
          type: 'PENDING_VENDORS',
          count,
          label: `${count} vendor application${count !== 1 ? 's' : ''} awaiting review`,
          href: '/admin/vendors',
          icon: '\ud83d\udd34',
        });
      }
    }

    if (has('VIEW_VENDOR_CHANGE_REQUESTS' as AdminPermission)) {
      const count = await this.prisma.vendorInfoChangeRequest.count({ where: { status: 'PENDING' } });
      if (count > 0) {
        items.push({
          type: 'PENDING_CHANGE_REQUESTS',
          count,
          label: `${count} vendor info change request${count !== 1 ? 's' : ''}`,
          href: '/admin/vendors/change-requests',
          icon: '\ud83d\udfe0',
        });
      }
    }

    if (has('VIEW_PENDING_PRODUCTS' as AdminPermission)) {
      const count = await this.prisma.product.count({ where: { status: 'PENDING_APPROVAL', deletedAt: null } });
      if (count > 0) {
        items.push({
          type: 'PENDING_PRODUCTS',
          count,
          label: `${count} product${count !== 1 ? 's' : ''} awaiting approval`,
          href: '/admin/products',
          icon: '\ud83d\udfe1',
        });
      }
    }

    return { items };
  }
}
