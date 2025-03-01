import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreatePrerequisiteDto {
  @IsNotEmpty()
  @IsMongoId()
  courseId: string;

  @IsNotEmpty()
  @IsMongoId()
  prerequisiteCourseId: string;
}
