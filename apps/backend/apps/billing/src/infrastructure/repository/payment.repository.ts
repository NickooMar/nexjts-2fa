import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentDocument } from '../schemas/payment.schema';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectModel('Payment')
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async create(input: Partial<PaymentDocument>): Promise<Payment> {
    const created = await this.paymentModel.create({
      _id: new Types.ObjectId(),
      ...input,
    });
    return new Payment(created.toObject());
  }

  async findByOrganization(
    organizationId: string,
    limit = 50,
  ): Promise<Payment[]> {
    if (!Types.ObjectId.isValid(organizationId)) return [];
    const docs = await this.paymentModel
      .find({
        organizationId: new Types.ObjectId(organizationId),
        deletedAt: null,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs.map((doc) => new Payment(doc));
  }

  async countAttempts(invoiceId: string): Promise<number> {
    return this.paymentModel.countDocuments({
      invoiceId: new Types.ObjectId(invoiceId),
    });
  }
}
