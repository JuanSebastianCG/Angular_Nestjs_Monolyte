import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScheduleDocument = Schedule & Document;

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({ required: true })
  daysWeek: string;

  @Prop({ required: true })
  startHour: string;

  @Prop({ required: true })
  endHour: string;

  // Add a method to convert to plain object
  toObject?(): Record<string, any>;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
