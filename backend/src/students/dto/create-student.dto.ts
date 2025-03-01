import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;
}
