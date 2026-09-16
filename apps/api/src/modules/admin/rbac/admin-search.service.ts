import { Injectable } from '@nestjs/common';
import { AdminPermission } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermissionsService, FULL_ACCESS } from './permissions.service';

export interface SearchResult {
  type: 'vendor' | 'product' | 'user';
  id: string;
  label: string;
  subtitle?: string;
  href: string;
}

const RESULTS_PER_TYPE = 5;
const MIN_QUERY_LENGTH = 2;

@Injectable()
export class AdminSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async search(userId: string, role: string, query: string): Promise<{ results: SearchResult[] }> {
    const q = query?.trim();
    if (!q || q.length < MIN_QUERY_LENGTH) return { results: [] };

    const effective = await this.permissionsService.getEffectivePermissions(userId, role);
    const has = (p: AdminPermission) => effective === FULL_ACCESS || effective.has(p);
    const results: SearchResult[] = [];

    if (has('VIEW_VENDORS' as AdminPermission)) {
      const vendors = await this.prisma.vendor.findMany({
        where: { businessName: { contains: q, mode: 'insensitive' } },
        take: RESULTS_PER_TYPE,
        select: { id: true, businessName: true },
      });
      results.push(
        ...vendors.map((v) => ({
          type: 'vendor' as const,
          id: v.id,
          label: v.businessName,
          href: '/admin/vendors',
        })),
      );
    }

    if (has('VIEW_PENDING_PRODUCTS' as AdminPermission)) {
      const products = await this.prisma.product.findMany({
        where: { title: { contains: q, mode: 'insensitive' }, deletedAt: null },
        take: RESULTS_PER_TYPE,
        select: { id: true, title: true },
      });
      results.push(
        ...products.map((p) => ({
          type: 'product' as const,
          id: p.id,
          label: p.title,
          href: '/admin/products',
        })),
      );
    }

    if (has('VIEW_USERS' as AdminPermission)) {
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: RESULTS_PER_TYPE,
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      results.push(
        ...users.map((u) => ({
          type: 'user' as const,
          id: u.id,
          label: `${u.firstName} ${u.lastName}`,
          subtitle: u.email,
          // Deep-links into the real search box we added to the Users page in Phase 4.
          href: `/admin/users?search=${encodeURIComponent(u.email)}`,
        })),
      );
    }

    return { results };
  }
}
