import { Types, Schema as MongooseSchema } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

/**
 * Plans live in the control-plane database. `limits` and `features` are
 * schemaless maps so new limits/toggles are data inserts, not migrations.
 */
@Schema({ timestamps: true })
export class PlanDocument {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ type: String, required: false, trim: true })
  description?: string;

  /** `{ monthly: { amount, currency }, yearly: { amount, currency } }`. */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true, default: {} })
  prices: Record<string, { amount: number; currency: string }>;

  /** Open map of numeric limits; -1 = unlimited. */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true, default: {} })
  limits: Record<string, number>;

  /** Open map of feature toggles. */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true, default: {} })
  features: Record<string, boolean>;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  trialDays: number;

  @Prop({ type: Boolean, required: true, default: true })
  isPublic: boolean;

  /** Soft delete: archived plans cannot be sold but keep serving subscribers. */
  @Prop({ type: Date, required: false, default: null })
  archivedAt?: Date | null;

  @Prop({ type: Number, required: true, default: 0 })
  sortOrder: number;

  @Prop({ type: Types.ObjectId, required: false })
  createdBy?: Types.ObjectId;
}

export const PlanSchema = SchemaFactory.createForClass(PlanDocument);

PlanSchema.index({ isPublic: 1, archivedAt: 1, sortOrder: 1 });
