import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import {
  InvoiceStatus,
  InvoiceStatuses,
  PaymentProviders,
  PaymentProviderName,
} from 'apps/constants';

@Schema({ _id: false })
class InvoiceLineItemSchema {
  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Number, required: true, default: 1 })
  quantity: number;

  @Prop({ type: Number, required: true })
  unitAmount: number;

  @Prop({ type: Number, required: true })
  amount: number;
}

@Schema({ timestamps: true })
export class InvoiceDocument {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  subscriptionId: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  number: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(InvoiceStatuses),
    default: InvoiceStatuses.OPEN,
  })
  status: InvoiceStatus;

  @Prop({ type: [InvoiceLineItemSchema], required: true, default: [] })
  lineItems: InvoiceLineItemSchema[];

  /** Minor units (cents). */
  @Prop({ type: Number, required: true, default: 0 })
  subtotal: number;

  @Prop({ type: Number, required: true, default: 0 })
  tax: number;

  @Prop({ type: Number, required: true, default: 0 })
  total: number;

  @Prop({ type: String, required: true, default: 'USD' })
  currency: string;

  @Prop({ type: Date, required: true })
  periodStart: Date;

  @Prop({ type: Date, required: true })
  periodEnd: Date;

  @Prop({ type: Date, required: false, default: null })
  dueDate?: Date | null;

  @Prop({ type: Date, required: false, default: null })
  paidAt?: Date | null;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(PaymentProviders),
    default: PaymentProviders.MOCK,
  })
  provider: PaymentProviderName;

  @Prop({ type: String, required: false })
  providerInvoiceId?: string;

  @Prop({ type: Date, required: false, default: null })
  deletedAt?: Date | null;
}

export const InvoiceSchema = SchemaFactory.createForClass(InvoiceDocument);

InvoiceSchema.index({ organizationId: 1, createdAt: -1 });
InvoiceSchema.index({ status: 1, dueDate: 1 });
