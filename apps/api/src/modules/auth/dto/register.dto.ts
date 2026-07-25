import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
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

  // OWASP baseline: 12+ chars, at least one upper, one lower, one digit, one symbol.
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(128)
  @Matches(/[a-z]/, { message: 'Password must contain a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain a number' })
  @Matches(/[^a-zA-Z0-9]/, { message: 'Password must contain a symbol' })
  password: string;
}
