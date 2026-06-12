import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Invoice } from '../../domain/entities/invoice.entity';
import { InvoiceDocument } from '../schemas/invoice.schema';

@Injectable()
export class InvoiceRepository {
  constructor(
    @InjectModel('Invoice')
    private readonly invoiceModel: Model<InvoiceDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * Sequential, gap-tolerant invoice numbers (`INV-2026-000042`) from an
   * atomic counter document — safe across replicas.
   */
  async nextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const counter = await this.connection
      .collection('billing_counters')
      .findOneAndUpdate(
        { _id: `invoice-${year}` as any },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' },
      );
    const seq = (counter?.seq ?? 1) as number;
    return `INV-${year}-${String(seq).padStart(6, '0')}`;
  }

  async create(input: Partial<InvoiceDocument>): Promise<Invoice> {
    const created = await this.invoiceModel.create({
      _id: new Types.ObjectId(),
      ...input,
    });
    return new Invoice(created.toObject());
  }

  async update(
    id: string,
    changes: Record<string, unknown>,
  ): Promise<Invoice | null> {
    const doc = await this.invoiceModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: changes },
        { new: true },
      )
      .lean();
    return doc ? new Invoice(doc) : null;
  }

  async findById(id: string): Promise<Invoice | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.invoiceModel.findById(new Types.ObjectId(id)).lean();
    return doc ? new Invoice(doc) : null;
  }

  async findByOrganization(
    organizationId: string,
    limit = 50,
  ): Promise<Invoice[]> {
    if (!Types.ObjectId.isValid(organizationId)) return [];
    const docs = await this.invoiceModel
      .find({
        organizationId: new Types.ObjectId(organizationId),
        deletedAt: null,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs.map((doc) => new Invoice(doc));
  }

  /** Latest unpaid invoice — the retry target for past_due subscriptions. */
  async findLatestOpen(organizationId: string): Promise<Invoice | null> {
    const doc = await this.invoiceModel
      .findOne({
        organizationId: new Types.ObjectId(organizationId),
        status: 'open',
        deletedAt: null,
      })
      .sort({ createdAt: -1 })
      .lean();
    return doc ? new Invoice(doc) : null;
  }
}
