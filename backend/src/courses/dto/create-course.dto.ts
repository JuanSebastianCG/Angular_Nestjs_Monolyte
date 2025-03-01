import { IsNotEmpty, IsString, IsMongoId, IsOptional } from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsMongoId()
  professorId: string;

  @IsNotEmpty()
  @IsMongoId()
  scheduleId: string;
}
