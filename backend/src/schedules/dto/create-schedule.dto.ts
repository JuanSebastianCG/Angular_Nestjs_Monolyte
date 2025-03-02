import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsDate,
  IsDateString,
} from 'class-validator';

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsArray()
  days: string[];

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @IsNotEmpty()
  @IsString()
  room: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
