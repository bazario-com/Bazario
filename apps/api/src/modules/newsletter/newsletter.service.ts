import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(dto: SubscribeDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('This email is already subscribed');
      }
      // Re-subscribing a previously unsubscribed email — reactivate rather than duplicate.
      return this.prisma.newsletterSubscriber.update({
        where: { email },
        data: { isActive: true },
      });
    }

    return this.prisma.newsletterSubscriber.create({ data: { email } });
  }
}
