import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import {
  PaymentStatus,
  PaymentStatuses,
  PaymentProviders,
  PaymentProviderName,
} from 'apps/constants';

@Schema({ timestamps: true })
export class PaymentDocument {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  invoiceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  subscriptionId: Types.ObjectId;

  /** Minor units (cents). */
  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true, default: 'USD' })
  currency: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(PaymentStatuses),
    default: PaymentStatuses.PENDING,
  })
  status: PaymentStatus;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(PaymentProviders),
    default: PaymentProviders.MOCK,
  })
  provider: PaymentProviderName;

  @Prop({ type: String, required: false })
  providerPaymentId?: string;

  @Prop({ type: Number, required: true, default: 1 })
  attempt: number;

  @Prop({ type: String, required: false, default: null })
  failureReason?: string | null;

  @Prop({ type: Date, required: false, default: null })
  refundedAt?: Date | null;

  @Prop({ type: Date, required: false, default: null })
  deletedAt?: Date | null;
}

export const PaymentSchema = SchemaFactory.createForClass(PaymentDocument);

PaymentSchema.index({ organizationId: 1, createdAt: -1 });
