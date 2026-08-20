import { IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitChangeRequestDto {
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  message: string;
}
