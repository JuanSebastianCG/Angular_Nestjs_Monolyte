import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DepartmentDocument = Department & Document;

@Schema({ timestamps: true })
export class Department {
  // Add _id explicitly for TypeScript
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  // Add a method to convert to plain object
  toObject?(): Record<string, any>;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
