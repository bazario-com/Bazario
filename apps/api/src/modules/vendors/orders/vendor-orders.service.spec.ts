import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VendorOrdersService } from './vendor-orders.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RewardsService } from '../../rewards/rewards.service';

describe('VendorOrdersService', () => {
  let service: VendorOrdersService;
  let prisma: any;
  let rewardsService: any;

  beforeEach(async () => {
    prisma = {
      order: { findFirst: jest.fn(), update: jest.fn() },
    };
    rewardsService = { earnForDeliveredOrder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorOrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: RewardsService, useValue: rewardsService },
      ],
    }).compile();

    service = module.get(VendorOrdersService);
  });

  it('throws NotFoundException for an order belonging to a different vendor', async () => {
    prisma.order.findFirst.mockResolvedValue(null);
    await expect(service.updateStatus('vendor-1', 'not-mine', 'PROCESSING')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('allows CONFIRMED -> PROCESSING', async () => {
    prisma.order.findFirst.mockResolvedValue({ id: 'o1', status: 'CONFIRMED', paymentMethod: 'COD' });
    prisma.order.update.mockResolvedValue({ id: 'o1', status: 'PROCESSING' });

    await service.updateStatus('vendor-1', 'o1', 'PROCESSING');
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { status: 'PROCESSING' },
    });
  });

  it('rejects skipping straight from CONFIRMED to DELIVERED', async () => {
    prisma.order.findFirst.mockResolvedValue({ id: 'o1', status: 'CONFIRMED', paymentMethod: 'COD' });
    await expect(service.updateStatus('vendor-1', 'o1', 'DELIVERED')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects moving a DELIVERED order anywhere else (terminal state)', async () => {
    prisma.order.findFirst.mockResolvedValue({ id: 'o1', status: 'DELIVERED', paymentMethod: 'COD' });
    await expect(service.updateStatus('vendor-1', 'o1', 'CANCELLED')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('marks a COD order as PAID when it transitions to DELIVERED', async () => {
    prisma.order.findFirst.mockResolvedValue({ id: 'o1', status: 'SHIPPED', paymentMethod: 'COD' });
    prisma.order.update.mockResolvedValue({ id: 'o1', status: 'DELIVERED' });

    await service.updateStatus('vendor-1', 'o1', 'DELIVERED');
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { status: 'DELIVERED', paymentStatus: 'PAID' },
    });
  });

  it('allows cancelling from PROCESSING', async () => {
    prisma.order.findFirst.mockResolvedValue({ id: 'o1', status: 'PROCESSING', paymentMethod: 'COD' });
    prisma.order.update.mockResolvedValue({ id: 'o1', status: 'CANCELLED' });

    await service.updateStatus('vendor-1', 'o1', 'CANCELLED');
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { status: 'CANCELLED' },
    });
  });
});
