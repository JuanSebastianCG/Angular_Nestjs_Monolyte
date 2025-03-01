import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type ProfessorDocument = Professor & Document;

@Schema({ timestamps: true })
export class Professor {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Date })
  hiringDate: Date;

  @Prop({ required: true })
  department: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department' })
  departmentId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: MongooseSchema.Types.ObjectId;
}

export const ProfessorSchema = SchemaFactory.createForClass(Professor);
