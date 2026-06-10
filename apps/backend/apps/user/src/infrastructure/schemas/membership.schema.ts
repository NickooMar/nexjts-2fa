import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import {
  OrganizationRole,
  ORGANIZATION_ROLES,
  OrganizationRoles,
} from 'apps/constants';

export type MembershipRole = OrganizationRole;
export type MembershipStatus = 'active' | 'invited' | 'suspended';

/**
 * Join between a user (control plane) and a tenant. A user may have many
 * memberships — one per organization they belong to. `isPrimary` marks the
 * org a credentials login defaults to.
 */
@Schema({ timestamps: true })
export class MembershipDocument {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    default: OrganizationRoles.MEMBER,
    enum: ORGANIZATION_ROLES,
  })
  role: MembershipRole;

  @Prop({
    type: String,
    required: true,
    default: 'active',
    enum: ['active', 'invited', 'suspended'],
  })
  status: MembershipStatus;

  @Prop({ required: true, default: false })
  isPrimary: boolean;
}

export const MembershipSchema =
  SchemaFactory.createForClass(MembershipDocument);

// A user can only be a member of a given tenant once.
MembershipSchema.index({ userId: 1, tenantId: 1 }, { unique: true });
