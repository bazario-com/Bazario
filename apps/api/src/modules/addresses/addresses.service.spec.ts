import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AddressesService', () => {
  let service: AddressesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      address: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(AddressesService);
  });

  it('rejects updating an address owned by a different user', async () => {
    prisma.address.findFirst.mockResolvedValue(null); // scoped query finds nothing

    await expect(
      service.update('attacker-user', 'someone-elses-address', {
        label: 'Home',
        recipientName: 'X',
        phone: '0300',
        line1: 'x',
        city: 'Lahore',
      }),
    ).rejects.toThrow(NotFoundException);

    // Confirms the lookup was scoped by userId, not just addressId
    expect(prisma.address.findFirst).toHaveBeenCalledWith({
      where: { id: 'someone-elses-address', userId: 'attacker-user' },
    });
  });

  it('rejects deleting an address that does not belong to the user', async () => {
    prisma.address.findFirst.mockResolvedValue(null);
    await expect(service.remove('attacker-user', 'not-mine')).rejects.toThrow(NotFoundException);
    expect(prisma.address.delete).not.toHaveBeenCalled();
  });

  it('unsets the previous default address when a new default is created', async () => {
    prisma.address.create.mockResolvedValue({ id: 'addr-2', isDefault: true });

    await service.create('user-1', {
      label: 'Office',
      recipientName: 'X',
      phone: '0300',
      line1: 'x',
      city: 'Lahore',
      isDefault: true,
    });

    expect(prisma.address.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isDefault: true },
      data: { isDefault: false },
    });
  });
});
