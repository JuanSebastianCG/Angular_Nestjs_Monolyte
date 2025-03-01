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

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  hiringDate?: Date;

  @IsNotEmpty()
  @IsMongoId()
  departmentId: string;
}
