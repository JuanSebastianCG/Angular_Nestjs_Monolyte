import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Student } from '../../students/schemas/student.schema';
import { Evaluation } from '../../evaluations/schemas/evaluation.schema';
import * as mongoose from 'mongoose';

export type StudentGradeDocument = StudentGrade & Document;

@Schema({ timestamps: true })
export class StudentGrade {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Evaluation',
    required: true,
  })
  evaluationId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  studentId: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: Number,
    min: 0,
    max: 100,
    required: true,
  })
  grade: number;

  @Prop()
  comments: string;

  // Add a method to convert to plain object
  toObject?(): Record<string, any>;
}

export const StudentGradeSchema = SchemaFactory.createForClass(StudentGrade);

// Add compound index to ensure uniqueness of evaluationId + studentId
StudentGradeSchema.index({ evaluationId: 1, studentId: 1 }, { unique: true });
