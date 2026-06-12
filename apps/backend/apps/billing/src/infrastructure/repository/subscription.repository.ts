import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SubscriptionStatus } from 'apps/constants';
import { Subscription } from '../../domain/entities/subscription.entity';
import { SubscriptionDocument } from '../schemas/subscription.schema';

@Injectable()
export class SubscriptionRepository {
  constructor(
    @InjectModel('Subscription')
    private readonly subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  /**
   * Match an organization id regardless of how it was stored. Org ids are
   * ObjectIds, but rows written by earlier schema iterations may persist the
   * value as a plain string; matching both BSON types keeps reads from
   * silently missing a current subscription (which would provision a duplicate
   * and trip the `organizationId_1_isCurrent_1` unique index).
   */
  private orgMatch(organizationId: string): Record<string, unknown> {
    const values: unknown[] = [organizationId];
    if (Types.ObjectId.isValid(organizationId)) {
      values.push(new Types.ObjectId(organizationId));
    }
    return { $in: values };
  }

  async findCurrentByOrganization(
    organizationId: string,
  ): Promise<Subscription | null> {
    if (!Types.ObjectId.isValid(organizationId)) return null;
    const doc = await this.subscriptionModel
      .findOne({
        organizationId: this.orgMatch(organizationId),
        isCurrent: true,
        deletedAt: null,
      })
      .lean();
    return doc ? new Subscription(doc) : null;
  }

  async findById(id: string): Promise<Subscription | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.subscriptionModel
      .findById(new Types.ObjectId(id))
      .lean();
    return doc ? new Subscription(doc) : null;
  }

  async create(input: Partial<SubscriptionDocument>): Promise<Subscription> {
    const created = await this.subscriptionModel.create({
      _id: new Types.ObjectId(),
      ...input,
    });
    return new Subscription(created.toObject());
  }

  async update(
    id: string,
    changes: Record<string, unknown>,
  ): Promise<Subscription | null> {
    const doc = await this.subscriptionModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: changes },
        { new: true, runValidators: true },
      )
      .lean();
    return doc ? new Subscription(doc) : null;
  }

  /**
   * Close the current row (history) so a replacement can become current.
   * Keeping closed rows gives a free audit trail of every plan change.
   */
  async closeCurrent(
    organizationId: string,
    finalStatus: SubscriptionStatus,
  ): Promise<void> {
    // updateMany (not updateOne): closes every current row so a mix of legacy
    // string- and ObjectId-typed rows can never leave two "current" rows behind
    // for a replacement to collide with.
    await this.subscriptionModel.updateMany(
      {
        organizationId: this.orgMatch(organizationId),
        isCurrent: true,
      },
      { $set: { isCurrent: false, status: finalStatus } },
    );
  }

  /** Full subscription history for an organization (audit view). */
  async findHistory(organizationId: string): Promise<Subscription[]> {
    const docs = await this.subscriptionModel
      .find({ organizationId: this.orgMatch(organizationId) })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((doc) => new Subscription(doc));
  }

  /** Current subscriptions with time-based transitions due (lifecycle sweep). */
  async findDueForLifecycle(now: Date): Promise<Subscription[]> {
    const docs = await this.subscriptionModel
      .find({
        isCurrent: true,
        deletedAt: null,
        $or: [
          { status: 'trialing', trialEndsAt: { $lte: now } },
          { status: { $in: ['active', 'past_due'] }, currentPeriodEnd: { $lte: now } },
          { status: 'past_due' },
          { status: 'cancelled', currentPeriodEnd: { $lte: now } },
        ],
      })
      .lean();
    return docs.map((doc) => new Subscription(doc));
  }
}
