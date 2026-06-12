import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

/**
 * Dedup ledger for consumed domain events. Usage events are delivered
 * at-least-once (fire-and-forget emit + retries), so each carries a unique
 * `eventId`; inserting here first makes the consumer idempotent. Rows expire
 * after 7 days — far longer than any redelivery window.
 */
@Schema({ timestamps: true })
export class ProcessedEventDocument {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  eventId: string;

  @Prop({ type: String, required: true })
  pattern: string;

  @Prop({ type: Date, required: true, default: () => new Date(), expires: 604800 })
  processedAt: Date;
}

export const ProcessedEventSchema = SchemaFactory.createForClass(
  ProcessedEventDocument,
);
