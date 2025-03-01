import {
  IsNotEmpty,
  IsString,
  IsDate,
  IsMongoId,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEvaluationDto {
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  evaluationDate: Date;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxScore?: number;

  @IsNotEmpty()
  @IsMongoId()
  courseId: string;
}
