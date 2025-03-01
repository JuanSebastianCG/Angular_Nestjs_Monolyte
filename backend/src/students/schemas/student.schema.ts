import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type StudentDocument = Student & Document;

@Schema({ timestamps: true })
export class Student {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: MongooseSchema.Types.ObjectId;

  // Add a method to convert to plain object
  toObject?(): Record<string, any>;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
