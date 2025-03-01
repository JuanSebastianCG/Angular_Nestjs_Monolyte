import {
  IsNotEmpty,
  IsMongoId,
  IsDate,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEnrollmentDto {
  @IsNotEmpty()
  @IsMongoId()
  studentId: string;

  @IsNotEmpty()
  @IsMongoId()
  courseId: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  enrollmentStartDate: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  enrollmentEndDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  finalGrade?: number;
}
