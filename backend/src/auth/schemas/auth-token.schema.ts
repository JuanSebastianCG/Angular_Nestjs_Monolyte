import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AuthTokenDocument = AuthToken & Document;

@Schema({ timestamps: true })
export class AuthToken {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;
}

export const AuthTokenSchema = SchemaFactory.createForClass(AuthToken);
