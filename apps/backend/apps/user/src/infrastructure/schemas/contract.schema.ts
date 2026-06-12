import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

export type ContractType = 'rental' | 'sale' | 'management' | 'other';

export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated';

export type PaymentFrequency =
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'yearly'
  | 'one_time';

/**
 * A contract attached to a property (lease, sale, management agreement…).
 * Lives in the tenant's own database. Scanned copies and annexes are stored
 * as media assets with `ownerType: 'contract'`.
 */
@Schema({ timestamps: true })
export class ContractDocument {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, default: randomUUID })
  uuid: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  propertyId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 160 })
  title: string;

  @Prop({
    type: String,
    required: true,
    default: 'rental',
    enum: ['rental', 'sale', 'management', 'other'],
  })
  type: ContractType;

  @Prop({
    type: String,
    required: true,
    default: 'active',
    enum: ['draft', 'active', 'expired', 'terminated'],
  })
  status: ContractStatus;

  @Prop({ type: Date, required: false })
  startDate?: Date;

  @Prop({ type: Date, required: false })
  endDate?: Date;

  @Prop({ type: Number, required: false, min: 0 })
  amount?: number;

  /** ISO 4217 code, e.g. USD / EUR / ARS. */
  @Prop({ type: String, required: false, trim: true, uppercase: true })
  currency?: string;

  @Prop({
    type: String,
    required: false,
    enum: ['monthly', 'quarterly', 'semiannual', 'yearly', 'one_time'],
  })
  paymentFrequency?: PaymentFrequency;

  @Prop({ type: Number, required: false, min: 0 })
  deposit?: number;

  @Prop({ type: String, required: false, trim: true, maxlength: 2000 })
  notes?: string;

  @Prop({ type: Types.ObjectId, required: false })
  createdBy?: Types.ObjectId;
}

export const ContractSchema = SchemaFactory.createForClass(ContractDocument);

ContractSchema.index({ propertyId: 1, createdAt: -1 });
