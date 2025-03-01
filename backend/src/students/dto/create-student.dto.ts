import { IsNotEmpty, IsString, IsDate, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  birthDate: Date;
}
