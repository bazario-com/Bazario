import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../rbac/audit-log.service';

const VALID_STATUSES = ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'];
const SORTABLE_FIELDS = ['createdAt', 'businessName', 'commissionRateBps'];

@Injectable()
export class AdminVendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAll(status?: string, page = 1, pageSize = 20, sortBy?: string, sortDir: 'asc' | 'desc' = 'desc') {
    if (status && !VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    const orderField = sortBy && SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const where = status ? { status: status as any } : undefined;
    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        orderBy: { [orderField]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { store: true, user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.vendor.count({ where }),
    ]);
    return { vendors, total, page, pageSize };
  }

  async approve(vendorId: string, actorId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    if (vendor.status === 'APPROVED') {
      throw new BadRequestException('Vendor is already approved');
    }

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'APPROVED', approvedAt: new Date(), rejectedReason: null },
    });
    await this.auditLog.log(actorId, 'APPROVE_VENDOR', {
      targetType: 'Vendor',
      targetId: vendorId,
      details: { businessName: vendor.businessName },
    });
    return updated;
  }

  async reject(vendorId: string, reason: string, actorId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'REJECTED', rejectedReason: reason },
    });
    await this.auditLog.log(actorId, 'REJECT_VENDOR', {
      targetType: 'Vendor',
      targetId: vendorId,
      details: { businessName: vendor.businessName, reason },
    });
    return updated;
  }

  async setCommission(vendorId: string, commissionRateBps: number) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { commissionRateBps },
    });
  }

  async listChangeRequests(status?: string, page = 1, pageSize = 20) {
    const where = status ? { status: status as any } : undefined;
    const [requests, total] = await Promise.all([
      this.prisma.vendorInfoChangeRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { vendor: { select: { businessName: true, businessRegNumber: true, taxId: true } } },
      }),
      this.prisma.vendorInfoChangeRequest.count({ where }),
    ]);
    return { requests, total, page, pageSize };
  }

  // Editing here (not a vendor-facing PATCH) is the whole point — vendors
  // can only request a change via a message, admin makes the actual edit.
  async updateRegistrationInfo(
    vendorId: string,
    data: { businessName?: string; businessRegNumber?: string; taxId?: string },
    requestId?: string,
  ) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const updated = await this.prisma.vendor.update({ where: { id: vendorId }, data });

    if (requestId) {
      await this.prisma.vendorInfoChangeRequest.update({
        where: { id: requestId },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });
    }

    return updated;
  }
}
