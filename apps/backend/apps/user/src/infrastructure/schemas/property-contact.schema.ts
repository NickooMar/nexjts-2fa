import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { Schema, Prop } from '@nestjs/mongoose';

/**
 * Shared persistence shape for people attached to properties (renters and
 * owners alike). Concrete documents — `PropertyTenantDocument`,
 * `PropertyOwnerDocument` — extend this so the two rosters live in separate
 * collections while sharing one field definition. Nest/Mongoose inherits the
 * base-class `@Prop` decorators.
 *
 * The property link is a plain id array: a contact can be created standalone,
 * attached to several properties over time, and detached without losing their
 * record (history, contact data, …).
 */
@Schema({ timestamps: true })
export class PropertyContactDocument {
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
