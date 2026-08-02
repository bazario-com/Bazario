import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ConversationType } from '@prisma/client';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsEnum(ConversationType)
  type: ConversationType;
}
