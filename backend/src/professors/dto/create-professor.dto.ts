import {
  IsNotEmpty,
  IsString,
  IsDate,
  IsMongoId,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProfessorDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  hiringDate: Date;

  @IsNotEmpty()
  @IsString()
  department: string;

  @IsOptional()
  @IsMongoId()
  departmentId?: string;
}
