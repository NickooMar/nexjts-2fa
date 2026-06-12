import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

export type TenantStatus = 'active' | 'suspended';

@Schema({ timestamps: true })
export class TenantDocument {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ required: true, unique: true, trim: true })
  dbName: string;

  @Prop({
    type: String,
    required: true,
    default: 'active',
    enum: ['active', 'suspended'],
  })
  status: TenantStatus;

  @Prop({ type: Types.ObjectId, required: false })
  ownerId: Types.ObjectId;

  @Prop({ type: String, required: false, trim: true })
  website?: string;

  @Prop({ type: String, required: false, trim: true })
  phone?: string;

  @Prop({ type: String, required: true, trim: true })
  country: string;

  /** Object-storage key of the organization logo (bytes live in S3/MinIO). */
  @Prop({ type: String, required: false })
  logoKey?: string;

  /** Object-storage key of the organization banner/cover image. */
  @Prop({ type: String, required: false })
  bannerKey?: string;
}

export const TenantSchema = SchemaFactory.createForClass(TenantDocument);
