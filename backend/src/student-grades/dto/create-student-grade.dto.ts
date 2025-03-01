import {
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateStudentGradeDto {
  @IsNotEmpty()
  @IsMongoId()
  evaluationId: string;

  @IsNotEmpty()
  @IsMongoId()
  studentId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  grade: number;

  @IsOptional()
  @IsString()
  comments?: string;
}
