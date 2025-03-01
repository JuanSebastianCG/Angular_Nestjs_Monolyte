import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  _id?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Date })
  birthDate?: Date;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password?: string;

  @Prop({ enum: ['admin', 'student', 'professor', 'user'], default: 'user' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
