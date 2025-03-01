import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsObject,
  IsIn,
  ValidateIf,
} from 'class-validator';

class StudentInfoDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  birthDate: Date;
}

class ProfessorInfoDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  department: string;
}

export class CreateUserDto {
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

  @IsOptional()
  @IsString()
  @IsIn(['student', 'professor'])
  role?: string;

  @ValidateIf((o) => o.role === 'student')
  @IsObject()
  studentInfo?: StudentInfoDto;

  @ValidateIf((o) => o.role === 'professor')
  @IsObject()
  professorInfo?: ProfessorInfoDto;
}
