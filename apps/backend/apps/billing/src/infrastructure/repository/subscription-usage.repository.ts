import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  LIFETIME_PERIOD,
  SubscriptionUsage,
} from '../../domain/entities/subscription-usage.entity';
import { SubscriptionUsageDocument } from '../schemas/subscription-usage.schema';

@Injectable()
export class SubscriptionUsageRepository {
  constructor(
    @InjectModel('SubscriptionUsage')
    private readonly usageModel: Model<SubscriptionUsageDocument>,
  ) {}

  /**
   * Atomically add `delta` to one counter. Upsert keeps the write path a
   * single round-trip; `$inc` makes concurrent events safe. Gauges may
   * transiently dip below zero on out-of-order events — clamped on read.
   */
  async increment(
    organizationId: string,
    period: string,
    counter: string,
    delta: number,
  ): Promise<void> {
    await this.usageModel.updateOne(
      { organizationId: new Types.ObjectId(organizationId), period },
      { $inc: { [`counters.${counter}`]: delta } },
      { upsert: true },
    );
  }

  /** Overwrite gauges with authoritative values (reconciliation). */
  async setCounters(
    organizationId: string,
    period: string,
    counters: Record<string, number>,
  ): Promise<void> {
    const sets = Object.fromEntries(
      Object.entries(counters).map(([key, value]) => [
        `counters.${key}`,
        value,
      ]),
    );
    await this.usageModel.updateOne(
      { organizationId: new Types.ObjectId(organizationId), period },
      { $set: { ...sets, syncedAt: new Date() } },
      { upsert: true },
    );
  }

  async find(
    organizationId: string,
    period: string,
  ): Promise<SubscriptionUsage | null> {
    if (!Types.ObjectId.isValid(organizationId)) return null;
    const doc = await this.usageModel
      .findOne({ organizationId: new Types.ObjectId(organizationId), period })
      .lean();
    return doc ? new SubscriptionUsage(doc) : null;
  }

  /** Lifetime gauges + the given month's meters merged into one map. */
  async countersFor(
    organizationId: string,
    monthPeriod: string,
  ): Promise<Record<string, number>> {
    const [lifetime, monthly] = await Promise.all([
      this.find(organizationId, LIFETIME_PERIOD),
      this.find(organizationId, monthPeriod),
    ]);
    const merged = { ...lifetime?.counters, ...monthly?.counters };
    // Clamp event-sourced gauges: deletes racing creates can dip below zero.
    for (const key of Object.keys(merged)) {
      if (merged[key] < 0) merged[key] = 0;
    }
    return merged;
  }
}
