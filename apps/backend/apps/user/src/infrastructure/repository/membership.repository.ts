import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OrganizationRole, OrganizationRoles } from 'apps/constants';
import { Membership } from '../../domain/entities/membership.entity';
import { MembershipDocument } from '../schemas/membership.schema';
import { BaseRepository } from 'libs/shared/repositories/base.repository';
import { CreateMembershipDto } from 'libs/shared/dto/membership/create-membership.dto';

@Injectable()
export class MembershipRepository extends BaseRepository<MembershipDocument> {
  constructor(
    @InjectModel('Membership')
    protected readonly membershipModel: Model<MembershipDocument>,
  ) {
    super(membershipModel);
  }

  async create(input: CreateMembershipDto): Promise<Membership> {
    const created = await super.create({
      userId: new Types.ObjectId(input.userId),
      tenantId: new Types.ObjectId(input.tenantId),
      role: input.role ?? OrganizationRoles.MEMBER,
      status: 'active',
      isPrimary: input.isPrimary ?? false,
    });
    return new Membership(created);
  }

  /**
   * Change a member's role within a tenant. Returns null if the membership does
   * not exist (e.g. the target user is not part of the org).
   */
  async updateRole(
    userId: string,
    tenantId: string,
    role: OrganizationRole,
  ): Promise<Membership | null> {
    const updated = await this.membershipModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          tenantId: new Types.ObjectId(tenantId),
        },
        { role },
        { new: true },
      )
      .lean();
    if (!updated) return null;
    return new Membership(updated);
  }

  async findByUser(userId: string): Promise<Membership[]> {
    const docs = await this.membershipModel
      .find({ userId: new Types.ObjectId(userId), status: 'active' })
      .sort({ createdAt: 1 })
      .lean();
    return docs.map((doc) => new Membership(doc));
  }

  async findByTenant(tenantId: string): Promise<Membership[]> {
    const docs = await this.membershipModel
      .find({ tenantId: new Types.ObjectId(tenantId), status: 'active' })
      .sort({ createdAt: 1 })
      .lean();
    return docs.map((doc) => new Membership(doc));
  }

  async findByUserAndTenant(
    userId: string,
    tenantId: string,
  ): Promise<Membership | null> {
    const doc = await super.findOne({
      userId: new Types.ObjectId(userId),
      tenantId: new Types.ObjectId(tenantId),
      status: 'active',
    });
    if (!doc) return null;
    return new Membership(doc);
  }

  /**
   * The org a credentials login defaults to: the membership flagged primary,
   * otherwise the earliest active one.
   */
  async findPrimaryForUser(userId: string): Promise<Membership | null> {
    const oid = new Types.ObjectId(userId);
    const primary = await super.findOne({
      userId: oid,
      status: 'active',
      isPrimary: true,
    });
    if (primary) return new Membership(primary);

    const earliest = await this.membershipModel
      .findOne({ userId: oid, status: 'active' })
      .sort({ createdAt: 1 })
      .lean();
    if (!earliest) return null;
    return new Membership(earliest);
  }
}
