import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Professor } from '../../professors/schemas/professor.schema';
import { Schedule } from '../../schedules/schemas/schedule.schema';
import { User } from '../../user/schemas/user.schema';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
