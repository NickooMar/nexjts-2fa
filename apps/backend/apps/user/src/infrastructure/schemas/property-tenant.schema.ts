import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

/**
 * A person renting/occupying a property — *not* the control-plane `Tenant`
 * (organization) document. Lives in the tenant's own database.
 *
 * The property link is a plain id array: a tenant can be created standalone,
 * attached to several properties over time, and detached without losing
 * their record (history, contact data, …).
 */
@Schema({ timestamps: true })
export class PropertyTenantDocument {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, default: randomUUID })
  uuid: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 160 })
  fullName: string;

  @Prop({ type: String, required: false, trim: true, lowercase: true })
  email?: string;

  @Prop({ type: String, required: false, trim: true })
  phone?: string;

  /** National identity / passport number — free-form. */
  @Prop({ type: String, required: false, trim: true })
  documentId?: string;

  @Prop({ type: String, required: false, trim: true, maxlength: 1000 })
  notes?: string;

  @Prop({ type: [Types.ObjectId], required: true, default: [], index: true })
  propertyIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, required: false })
  createdBy?: Types.ObjectId;
}

export const PropertyTenantSchema = SchemaFactory.createForClass(
  PropertyTenantDocument,
);
