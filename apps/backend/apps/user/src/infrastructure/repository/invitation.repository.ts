import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OrganizationRole, OrganizationRoles } from 'apps/constants';
import { Invitation } from '../../domain/entities/invitation.entity';
import {
  InvitationDocument,
  InvitationStatus,
} from '../schemas/invitation.schema';
import { BaseRepository } from 'libs/shared/repositories/base.repository';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class InvitationRepository extends BaseRepository<InvitationDocument> {
  constructor(
    @InjectModel('Invitation')
    protected readonly invitationModel: Model<InvitationDocument>,
  ) {
    super(invitationModel);
  }

  async createForTenant(
    tenantId: string,
    role: OrganizationRole = OrganizationRoles.MEMBER,
    createdBy?: string,
  ): Promise<Invitation> {
    const created = await super.create({
      // 8 hex chars, uppercased — short enough to share, unique-indexed.
      code: randomBytes(4).toString('hex').toUpperCase(),
      tenantId: new Types.ObjectId(tenantId),
      role,
      status: 'pending',
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
    });
    return new Invitation(created);
  }

  async findByCode(code: string): Promise<Invitation | null> {
    const doc = await super.findOne({ code: code.trim().toUpperCase() });
    if (!doc) return null;
    return new Invitation(doc);
  }

  async setStatus(
    id: string,
    status: InvitationStatus,
    acceptedBy?: string,
  ): Promise<Invitation | null> {
    const updated = await this.invitationModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        {
          status,
          ...(acceptedBy ? { acceptedBy: new Types.ObjectId(acceptedBy) } : {}),
        },
        { new: true },
      )
      .lean();
    if (!updated) return null;
    return new Invitation(updated);
  }
}
