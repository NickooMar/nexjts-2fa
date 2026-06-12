import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FeatureFlag } from '../../domain/entities/feature-flag.entity';
import { FeatureFlagDocument } from '../schemas/feature-flag.schema';

@Injectable()
export class FeatureFlagRepository {
  constructor(
    @InjectModel('FeatureFlag')
    private readonly flagModel: Model<FeatureFlagDocument>,
  ) {}

  /** Non-expired overrides for an organization. */
  async findActiveByOrganization(
    organizationId: string,
  ): Promise<FeatureFlag[]> {
    if (!Types.ObjectId.isValid(organizationId)) return [];
    const docs = await this.flagModel
      .find({
        organizationId: new Types.ObjectId(organizationId),
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      })
      .lean();
    return docs.map((doc) => new FeatureFlag(doc));
  }

  async upsert(input: {
    organizationId: string;
    key: string;
    enabled: boolean;
    expiresAt?: Date | null;
    reason?: string;
    createdBy?: string;
  }): Promise<void> {
    await this.flagModel.updateOne(
      {
        organizationId: new Types.ObjectId(input.organizationId),
        key: input.key,
      },
      {
        $set: {
          enabled: input.enabled,
          expiresAt: input.expiresAt ?? null,
          reason: input.reason,
          ...(input.createdBy
            ? { createdBy: new Types.ObjectId(input.createdBy) }
            : {}),
        },
        $setOnInsert: { _id: new Types.ObjectId() },
      },
      { upsert: true },
    );
  }
}
