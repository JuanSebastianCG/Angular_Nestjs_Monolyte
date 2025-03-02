import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type AuthTokenDocument = AuthToken & Document;

@Schema({ timestamps: true })
export class AuthToken {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  refreshToken: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ required: true, type: Date })
  refreshExpiresAt: Date;

  @Prop({ required: false })
  deviceId?: string;
}

export const AuthTokenSchema = SchemaFactory.createForClass(AuthToken);
