import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Student } from '../../students/schemas/student.schema';
import { Course } from '../../courses/schemas/course.schema';

export type EnrollmentDocument = Enrollment & Document;

@Schema({ timestamps: true })
export class Enrollment {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Student',
    required: true,
  })
  studentId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Course',
    required: true,
  })
  courseId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: Date })
  enrollmentStartDate: Date;

  @Prop({ type: Date })
  enrollmentEndDate: Date;

  @Prop({ type: Number, min: 0, max: 100 })
  finalGrade: number;

  // Add a method to convert to plain object
  toObject?(): Record<string, any>;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

// Add compound index to ensure uniqueness of studentId + courseId
EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
