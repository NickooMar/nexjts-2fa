import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Plan } from '../../domain/entities/plan.entity';
import { PlanDocument } from '../schemas/plan.schema';

@Injectable()
export class PlanRepository {
  constructor(
    @InjectModel('Plan')
    private readonly planModel: Model<PlanDocument>,
  ) {}

  /** Sellable catalog: public, non-archived, in display order. */
  async findPublic(): Promise<Plan[]> {
    const docs = await this.planModel
      .find({ isPublic: true, archivedAt: null })
      .sort({ sortOrder: 1 })
      .lean();
    return docs.map((doc) => new Plan(doc));
  }

  async findById(id: string): Promise<Plan | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.planModel.findById(new Types.ObjectId(id)).lean();
    return doc ? new Plan(doc) : null;
  }

  async findBySlug(slug: string): Promise<Plan | null> {
    const doc = await this.planModel
      .findOne({ slug: slug.toLowerCase() })
      .lean();
    return doc ? new Plan(doc) : null;
  }

  async create(input: Partial<PlanDocument>): Promise<Plan> {
    const created = await this.planModel.create({
      _id: new Types.ObjectId(),
      ...input,
    });
    return new Plan(created.toObject());
  }

  async update(
    id: string,
    changes: Partial<PlanDocument>,
  ): Promise<Plan | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.planModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: changes },
        { new: true, runValidators: true },
      )
      .lean();
    return doc ? new Plan(doc) : null;
  }

  /** Soft delete — archived plans keep serving existing subscriptions. */
  async archive(id: string): Promise<Plan | null> {
    return this.update(id, { archivedAt: new Date() } as Partial<PlanDocument>);
  }

  /** Idempotent seed helper: inserts the plan only if the slug is new. */
  async upsertBySlug(input: Partial<PlanDocument>): Promise<void> {
    await this.planModel.updateOne(
      { slug: input.slug },
      { $setOnInsert: { _id: new Types.ObjectId(), ...input } },
      { upsert: true },
    );
  }
}
