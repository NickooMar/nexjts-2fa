import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class UserDocument {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ unique: true, required: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({ required: true, trim: true })
  password: string;

  @Prop({ required: true, default: false })
  emailVerified: boolean;

  @Prop({
    type: {
      expiresAt: { type: String, required: false },
      code: { type: String, required: false },
    },
    default: () => ({}),
    _id: false,
  })
  emailVerification: {
    expiresAt?: string;
    code?: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);
