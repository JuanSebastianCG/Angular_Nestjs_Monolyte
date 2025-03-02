import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class UpdateScheduleDto {
  @IsOptional()
  @IsArray()
  days?: string[];

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
