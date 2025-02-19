import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Role } from 'apps/auth/src/domain/entities/role.entity';

@Schema({ timestamps: true })
export class UserDocument {
  _id: Types.ObjectId;

  @Prop({ unique: true, required: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  username: string;

  @Prop({ required: true, trim: true })
  password: string;

  @Prop({
    required: true,
    default: [Role.REGULAR],
    type: [{ type: String, enum: Object.values(Role) }],
  })
  roles?: Role[];
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);
