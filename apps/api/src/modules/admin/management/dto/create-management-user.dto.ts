import { IsEmail, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateManagementUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsUUID()
  roleId: string;
}
