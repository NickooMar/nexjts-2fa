import { Types, Schema as MongooseSchema } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

/**
 * One row per organization per period (`lifetime` gauges or `YYYY-MM`
 * monthly meters). Counters are updated with atomic `$inc`/`$set` so
 * concurrent events never lose updates.
 */
@Schema({ timestamps: true })
export class SubscriptionUsageDocument {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: String, required: true })
  period: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true, default: {} })
  counters: Record<string, number>;

  @Prop({ type: Date, required: false, default: null })
  syncedAt?: Date | null;
}

export const SubscriptionUsageSchema = SchemaFactory.createForClass(
  SubscriptionUsageDocument,
);

SubscriptionUsageSchema.index(
  { organizationId: 1, period: 1 },
  { unique: true },
);
