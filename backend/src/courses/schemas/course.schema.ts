import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Professor } from '../../professors/schemas/professor.schema';
import { Schedule } from '../../schedules/schemas/schedule.schema';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professor',
  })
  professorId: mongoose.Schema.Types.ObjectId;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
  })
  scheduleId: mongoose.Schema.Types.ObjectId;

  // Add a method to convert to plain object
  toObject?(): Record<string, any>;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
