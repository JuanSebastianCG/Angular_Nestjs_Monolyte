import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Course } from '../../courses/schemas/course.schema';

export type PrerequisiteDocument = Prerequisite & Document;

@Schema({ timestamps: true })
export class Prerequisite {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Course',
    required: true,
  })
  courseId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Course',
    required: true,
  })
  prerequisiteCourseId: MongooseSchema.Types.ObjectId;

  // Add a method to convert to plain object
  toObject?(): Record<string, any>;
}

export const PrerequisiteSchema = SchemaFactory.createForClass(Prerequisite);

// Add compound index to ensure uniqueness of courseId + prerequisiteCourseId
PrerequisiteSchema.index(
  { courseId: 1, prerequisiteCourseId: 1 },
  { unique: true },
);
