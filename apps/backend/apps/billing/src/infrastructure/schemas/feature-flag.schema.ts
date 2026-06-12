import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

/** Per-organization feature override merged over `plan.features`. */
@Schema({ timestamps: true })
export class FeatureFlagDocument {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  key: string;

  @Prop({ type: Boolean, required: true })
  enabled: boolean;

  @Prop({ type: Date, required: false, default: null })
  expiresAt?: Date | null;

  @Prop({ type: String, required: false })
  reason?: string;

  @Prop({ type: Types.ObjectId, required: false })
  createdBy?: Types.ObjectId;
}

export const FeatureFlagSchema =
  SchemaFactory.createForClass(FeatureFlagDocument);

FeatureFlagSchema.index({ organizationId: 1, key: 1 }, { unique: true });
