import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Professor } from '../../professors/entities/professor.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Schema()
export class Course extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Professor', required: true })
  professor_id: Professor;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Schedule', required: true })
  schedule_id: Schedule;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
