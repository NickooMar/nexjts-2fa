import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import {
  OrganizationRole,
  ORGANIZATION_ROLES,
  OrganizationRoles,
} from 'apps/constants';

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

/**
 * An invitation to join an organization. Code-based: an owner/admin generates
 * a code, any authenticated user can redeem it to become a member with the
 * invitation's role.
 */
@Schema({ timestamps: true })
export class InvitationDocument {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, trim: true })
  code: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    default: OrganizationRoles.MEMBER,
    enum: ORGANIZATION_ROLES,
  })
  role: OrganizationRole;

  @Prop({
    type: String,
    required: true,
    default: 'pending',
    enum: ['pending', 'accepted', 'revoked', 'expired'],
  })
  status: InvitationStatus;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Types.ObjectId, required: false })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: false })
  acceptedBy: Types.ObjectId;
}

export const InvitationSchema =
  SchemaFactory.createForClass(InvitationDocument);
