import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Role } from '@prisma/client';

@Controller('conversations')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post()
  createOrGet(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateConversationDto) {
    return this.messagingService.findOrCreateForOrder(
      dto.orderId!,
      user.id,
      user.role as Role,
      dto.type,
    );
  }

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.getConversationsForUser(user.id);
  }

  @Get(':id/messages')
  getMessages(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.messagingService.getMessages(id, user.id);
  }

  @Post(':id/messages')
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagingService.sendMessage(id, user.id, user.role as Role, dto);
  }

  @Patch(':id/escalate')
  escalate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.messagingService.escalate(id, user.id);
  }
}

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@RequirePermission('MANAGE_SUPPORT_CONVERSATIONS')
@Controller('admin/conversations')
export class AdminMessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get()
  findAll(@Query('status') status?: string, @Query('escalated') escalated?: string) {
    return this.messagingService.adminGetAllConversations({
      status,
      escalated: escalated === undefined ? undefined : escalated === 'true',
    });
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string) {
    return this.messagingService.adminGetMessages(id);
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.messagingService.adminResolve(id);
  }
}
