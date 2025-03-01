import { IsNotEmpty, IsString, IsDate, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScheduleDto {
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsNotEmpty()
  @IsString()
  daysWeek: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start hour must be in format HH:MM (24-hour)',
  })
  startHour: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End hour must be in format HH:MM (24-hour)',
  })
  endHour: string;
}
