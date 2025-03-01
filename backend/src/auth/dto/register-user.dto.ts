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

export class RegisterUserDto {
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
