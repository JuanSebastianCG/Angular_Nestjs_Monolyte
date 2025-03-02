import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScheduleDocument = Schedule & Document;

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ required: true, type: [String] })
  days: string[];

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ required: true })
  room: string;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop()
  notes?: string;

  // Add a method to convert to plain object
  toObject?(): Record<string, any>;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
