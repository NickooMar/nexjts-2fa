import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import {
  BillingCycle,
  BillingCycles,
  PaymentProviders,
  SubscriptionStatus,
  SubscriptionStatuses,
  PaymentProviderName,
} from 'apps/constants';

@Schema({ timestamps: true })
export class SubscriptionDocument {
  _id: Types.ObjectId;

  /** Control-plane Tenant id — billing is organization-scoped, never per-user. */
  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  planId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(SubscriptionStatuses),
    index: true,
  })
  status: SubscriptionStatus;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(BillingCycles),
    default: BillingCycles.MONTHLY,
  })
  billingCycle: BillingCycle;

  /** Exactly one current row per organization (partial unique index below). */
  @Prop({ type: Boolean, required: true, default: true })
  isCurrent: boolean;

  @Prop({ type: Date, required: true })
  currentPeriodStart: Date;

  @Prop({ type: Date, required: true })
  currentPeriodEnd: Date;

  @Prop({ type: Date, required: false, default: null })
  trialEndsAt?: Date | null;

  @Prop({ type: Boolean, required: true, default: false })
  cancelAtPeriodEnd: boolean;

  @Prop({ type: Date, required: false, default: null })
  cancelledAt?: Date | null;

  @Prop({ type: Date, required: false, default: null })
  pastDueSince?: Date | null;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(PaymentProviders),
    default: PaymentProviders.MOCK,
  })
  provider: PaymentProviderName;

  @Prop({ type: String, required: false })
  providerCustomerId?: string;

  @Prop({ type: String, required: false })
  providerSubscriptionId?: string;

  @Prop({ type: Types.ObjectId, required: false })
  createdBy?: Types.ObjectId;

  @Prop({ type: Date, required: false, default: null })
  deletedAt?: Date | null;
}

export const SubscriptionSchema =
  SchemaFactory.createForClass(SubscriptionDocument);

// One *current* subscription per organization; closed rows form the history.
SubscriptionSchema.index(
  { organizationId: 1, isCurrent: 1 },
  { unique: true, partialFilterExpression: { isCurrent: true } },
);
SubscriptionSchema.index({ organizationId: 1, createdAt: -1 });
