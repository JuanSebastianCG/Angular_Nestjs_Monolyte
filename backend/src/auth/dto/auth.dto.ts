import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { RegisterUserDto } from './register-user.dto';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  role?: string;
}

// Re-export RegisterUserDto for convenience
export { RegisterUserDto };
