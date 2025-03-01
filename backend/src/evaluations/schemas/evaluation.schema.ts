import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Course } from '../../courses/schemas/course.schema';

export type EvaluationDocument = Evaluation & Document;

@Schema({ timestamps: true })
export class Evaluation {
  @Prop({ required: true, type: Date })
  evaluationDate: Date;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Number, min: 0, max: 100, default: 100 })
  maxScore: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Course',
    required: true,
  })
  courseId: MongooseSchema.Types.ObjectId;

  // Add a method to convert to plain object
  toObject?(): Record<string, any>;
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
