import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
