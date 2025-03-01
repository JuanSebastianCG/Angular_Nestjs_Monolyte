import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../user/schemas/user.schema';
import { Department } from '../../departments/schemas/department.schema';

export type ProfessorDocument = Professor & Document;

@Schema({ timestamps: true })
export class Professor {
  @Prop({ required: true, type: Date })
  hiringDate: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Department',
    required: true,
  })
  departmentId: MongooseSchema.Types.ObjectId;

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

export const ProfessorSchema = SchemaFactory.createForClass(Professor);
