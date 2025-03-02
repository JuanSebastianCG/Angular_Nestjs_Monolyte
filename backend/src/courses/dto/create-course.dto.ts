import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateScheduleDto } from '../../schedules/dto/create-schedule.dto';

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

  @IsOptional()
  @IsMongoId()
  scheduleId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateScheduleDto)
  schedule?: CreateScheduleDto;
}
