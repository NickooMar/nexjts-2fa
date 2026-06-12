import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ProcessedEventDocument } from '../schemas/processed-event.schema';

@Injectable()
export class ProcessedEventRepository {
  constructor(
    @InjectModel('ProcessedEvent')
    private readonly eventModel: Model<ProcessedEventDocument>,
  ) {}

  /**
   * Claim an event id. Returns false when it was already processed (duplicate
   * delivery) — the unique index is the arbiter, so concurrent consumers
   * cannot double-apply.
   */
  async claim(eventId: string, pattern: string): Promise<boolean> {
    if (!eventId) return true; // events without ids are applied best-effort
    try {
      await this.eventModel.create({
        _id: new Types.ObjectId(),
        eventId,
        pattern,
        processedAt: new Date(),
      });
      return true;
    } catch (error: any) {
      if (error?.code === 11000) return false;
      throw error;
    }
  }
}
