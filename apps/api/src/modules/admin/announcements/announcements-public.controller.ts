import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('announcements')
export class AnnouncementsPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('active')
  async findActive() {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
