import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

export enum UserRole {
  REGULAR = 'regular',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ unique: true, required: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  username: string;

  @Prop({ required: true, trim: true })
  password: string;

  @Prop({ required: false, default: UserRole.REGULAR, enum: UserRole })
  role: UserRole[];
}

export const UserSchema = SchemaFactory.createForClass(User);
