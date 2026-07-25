import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertAddressDto } from './dto/upsert-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, dto: UpsertAddressDto) {
    if (dto.isDefault) await this.clearExistingDefault(userId);
    return this.prisma.address.create({ data: { ...dto, userId } });
  }

  async update(userId: string, addressId: string, dto: UpsertAddressDto) {
    await this.assertOwnership(userId, addressId);
    if (dto.isDefault) await this.clearExistingDefault(userId);
    return this.prisma.address.update({ where: { id: addressId }, data: dto });
  }

  async remove(userId: string, addressId: string) {
    await this.assertOwnership(userId, addressId);
    await this.prisma.address.delete({ where: { id: addressId } });
    return { success: true };
  }

  // Every address lookup/mutation is filtered by userId at the query level
  // (not just checked after fetching) so one user can never read or modify
  // another user's address by guessing an ID (IDOR prevention).
  private async assertOwnership(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  private clearExistingDefault(userId: string) {
    return this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }
}
