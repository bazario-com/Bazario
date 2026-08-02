import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationType, Role } from '@prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';
import { containsContactInfo } from './contact-filter.util';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateForOrder(
    orderId: string,
    userId: string,
    userRole: Role,
    type: ConversationType,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { vendor: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const isCustomer = order.userId === userId;
    const isVendor = order.vendor.userId === userId;
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    if (!isCustomer && !isVendor && !isAdmin) {
      throw new ForbiddenException('You are not part of this order');
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: { orderId, type },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          orderId,
          type,
          participants: {
            create: [
              { userId: order.userId, role: Role.CUSTOMER },
              { userId: order.vendor.userId, role: Role.VENDOR },
            ],
          },
        },
      });
    }

    return conversation;
  }

  async getConversationsForUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        order: { select: { id: true, orderNumber: true } },
      },
    });
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException('You are not part of this conversation');
    }
  }

  async getMessages(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
    return messages;
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    userRole: Role,
    dto: CreateMessageDto,
  ) {
    await this.assertParticipant(conversationId, userId);

    if (!dto.body && !dto.imageUrl) {
      throw new BadRequestException('Message must have text or an image');
    }
    if (containsContactInfo(dto.body)) {
      throw new BadRequestException(
        'Message blocked: sharing phone numbers or off-platform contact details is not allowed',
      );
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        senderRole: userRole,
        body: dto.body,
        imageUrl: dto.imageUrl,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async escalate(conversationId: string, userId: string) {
    await this.assertParticipant(conversationId, userId);
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { escalated: true },
    });
  }

  // --- Admin ---

  async adminGetAllConversations(filters: { status?: string; escalated?: boolean }) {
    return this.prisma.conversation.findMany({
      where: {
        ...(filters.status ? { status: filters.status as any } : {}),
        ...(filters.escalated !== undefined ? { escalated: filters.escalated } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } },
        order: { select: { id: true, orderNumber: true } },
      },
    });
  }

  async adminGetMessages(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });
  }

  async adminResolve(conversationId: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'RESOLVED', escalated: false },
    });
  }
}
