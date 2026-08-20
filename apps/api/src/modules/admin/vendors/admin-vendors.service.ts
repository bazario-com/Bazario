import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const VALID_STATUSES = ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'];

@Injectable()
export class AdminVendorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: string) {
    if (status && !VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    return this.prisma.vendor.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { store: true, user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  async approve(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    if (vendor.status === 'APPROVED') {
      throw new BadRequestException('Vendor is already approved');
    }

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'APPROVED', approvedAt: new Date(), rejectedReason: null },
    });
  }

  async reject(vendorId: string, reason: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'REJECTED', rejectedReason: reason },
    });
  }

  async setCommission(vendorId: string, commissionRateBps: number) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { commissionRateBps },
    });
  }

  listChangeRequests(status?: string) {
    return this.prisma.vendorInfoChangeRequest.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { vendor: { select: { businessName: true, businessRegNumber: true, taxId: true } } },
    });
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
