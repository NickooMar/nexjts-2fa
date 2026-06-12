import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Contract } from '../../domain/entities/contract.entity';
import {
  ContractType,
  ContractSchema,
  ContractStatus,
  ContractDocument,
  PaymentFrequency,
} from '../schemas/contract.schema';
import { TenantConnectionService } from '../tenancy/tenant-connection.service';

export interface CreateContractRecord {
  title: string;
  type?: ContractType;
  status?: ContractStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  amount?: number;
  currency?: string;
  paymentFrequency?: PaymentFrequency;
  deposit?: number;
  notes?: string;
}

/**
 * Contract data lives in the tenant's own database. Every method receives the
 * tenant `dbName` and resolves its model through {@link TenantConnectionService}.
 */
@Injectable()
export class ContractRepository {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  private model(dbName: string): Model<ContractDocument> {
    return this.tenantConnection.getModel<ContractDocument>(
      dbName,
      'Contract',
      ContractSchema,
    );
  }

  async create(
    dbName: string,
    propertyId: string,
    input: CreateContractRecord,
    createdBy?: string,
  ): Promise<Contract> {
    const created = await this.model(dbName).create({
      _id: new Types.ObjectId(),
      propertyId: new Types.ObjectId(propertyId),
      title: input.title,
      type: input.type ?? 'rental',
      status: input.status ?? 'active',
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      amount: input.amount,
      currency: input.currency,
      paymentFrequency: input.paymentFrequency,
      deposit: input.deposit,
      notes: input.notes,
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
    });
    return new Contract(created.toObject());
  }

  async findByProperty(dbName: string, propertyId: string): Promise<Contract[]> {
    if (!Types.ObjectId.isValid(propertyId)) return [];
    const docs = await this.model(dbName)
      .find({ propertyId: new Types.ObjectId(propertyId) })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((doc) => new Contract(doc));
  }

  /** Resolve a contract by Mongo id or public uuid. */
  async findByIdOrUuid(dbName: string, id: string): Promise<Contract | null> {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: new Types.ObjectId(id) }
      : { uuid: id };
    const doc = await this.model(dbName).findOne(filter).lean();
    return doc ? new Contract(doc) : null;
  }

  async update(
    dbName: string,
    id: string,
    changes: Record<string, unknown>,
  ): Promise<Contract | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model(dbName)
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: changes },
        { new: true, runValidators: true },
      )
      .lean();
    return doc ? new Contract(doc) : null;
  }

  async delete(dbName: string, id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await this.model(dbName).deleteOne({
      _id: new Types.ObjectId(id),
    });
    return result.deletedCount > 0;
  }

  /** Remove every contract of a property; returns them for media cleanup. */
  async deleteByProperty(
    dbName: string,
    propertyId: string,
  ): Promise<Contract[]> {
    const contracts = await this.findByProperty(dbName, propertyId);
    if (contracts.length > 0) {
      await this.model(dbName).deleteMany({
        propertyId: new Types.ObjectId(propertyId),
      });
    }
    return contracts;
  }
}
