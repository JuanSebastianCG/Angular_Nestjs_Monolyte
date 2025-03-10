import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsObject,
  IsIn,
  ValidateIf,
  IsDate,
  IsMongoId,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class StudentInfoDto {
  // No properties needed now that birthDate is moved to User
}

export class ProfessorInfoDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  hiringDate?: Date;

  @IsNotEmpty()
  @IsMongoId()
  departmentId: string;
}

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthDate?: Date;

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
  @IsEnum(['admin', 'student', 'professor', 'user'], {
    message: 'Role must be one of: admin, student, professor, user',
  })
  role?: string;

  @ValidateIf((o) => o.role === 'student')
  @IsObject()
  studentInfo?: StudentInfoDto;

  @ValidateIf((o) => o.role === 'professor')
  @IsObject()
  professorInfo?: ProfessorInfoDto;
}
