import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

export type PropertyType =
  | 'apartment'
  | 'house'
  | 'commercial'
  | 'land'
  | 'other';

/**
 * Lives in the tenant's own database, so a unique index on `slug` already
 * means "unique per organization". `organizationId` is still persisted so a
 * document is self-describing (exports, audits, cross-db tooling).
 */
@Schema({ timestamps: true })
export class PropertyDocument {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, default: randomUUID })
  uuid: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  slug: string;

  @Prop({ type: String, required: false, trim: true, maxlength: 2000 })
  description?: string;

  @Prop({ required: true, trim: true })
  address: string;

  @Prop({ type: String, required: false, trim: true })
  city?: string;

  @Prop({ type: String, required: false, trim: true })
  state?: string;

  @Prop({ type: String, required: false, trim: true })
  stateCode?: string;

  @Prop({ type: String, required: false, trim: true })
  country?: string;

  @Prop({ type: String, required: false, trim: true })
  postalCode?: string;

  @Prop({
    type: String,
    required: true,
    default: 'apartment',
    enum: ['apartment', 'house', 'commercial', 'land', 'other'],
  })
  type: PropertyType;

  @Prop({ required: false, default: 1, min: 0 })
  units: number;

  @Prop({ type: Types.ObjectId, required: false })
  createdBy: Types.ObjectId;
}

export const PropertySchema = SchemaFactory.createForClass(PropertyDocument);
