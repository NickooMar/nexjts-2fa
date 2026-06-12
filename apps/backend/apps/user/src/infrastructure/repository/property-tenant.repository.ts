import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { PropertyTenant } from '../../domain/entities/property-tenant.entity';
import {
  PropertyTenantSchema,
  PropertyTenantDocument,
} from '../schemas/property-tenant.schema';
import { TenantConnectionService } from '../tenancy/tenant-connection.service';

export interface CreatePropertyTenantRecord {
  fullName: string;
  email?: string;
  phone?: string;
  documentId?: string;
  notes?: string;
  /** Properties the tenant occupies from day one (optional). */
  propertyIds?: string[];
}

/**
 * Property-tenant (renter) data lives in the tenant's own database. Every
 * method receives the tenant `dbName` and resolves its model through
 * {@link TenantConnectionService}.
 */
@Injectable()
export class PropertyTenantRepository {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  private model(dbName: string): Model<PropertyTenantDocument> {
    return this.tenantConnection.getModel<PropertyTenantDocument>(
      dbName,
      'PropertyTenant',
      PropertyTenantSchema,
    );
  }

  async create(
    dbName: string,
    input: CreatePropertyTenantRecord,
    createdBy?: string,
  ): Promise<PropertyTenant> {
    const created = await this.model(dbName).create({
      _id: new Types.ObjectId(),
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      documentId: input.documentId,
      notes: input.notes,
      propertyIds: (input.propertyIds ?? [])
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id)),
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
    });
    return new PropertyTenant(created.toObject());
  }

  async findAll(dbName: string): Promise<PropertyTenant[]> {
    const docs = await this.model(dbName)
      .find()
      .sort({ fullName: 1 })
      .lean();
    return docs.map((doc) => new PropertyTenant(doc));
  }

  async findByProperty(
    dbName: string,
    propertyId: string,
  ): Promise<PropertyTenant[]> {
    if (!Types.ObjectId.isValid(propertyId)) return [];
    const docs = await this.model(dbName)
      .find({ propertyIds: new Types.ObjectId(propertyId) })
      .sort({ fullName: 1 })
      .lean();
    return docs.map((doc) => new PropertyTenant(doc));
  }

  async findByIdOrUuid(
    dbName: string,
    id: string,
  ): Promise<PropertyTenant | null> {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: new Types.ObjectId(id) }
      : { uuid: id };
    const doc = await this.model(dbName).findOne(filter).lean();
    return doc ? new PropertyTenant(doc) : null;
  }

  async update(
    dbName: string,
    id: string,
    changes: Record<string, unknown>,
  ): Promise<PropertyTenant | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model(dbName)
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: changes },
        { new: true, runValidators: true },
      )
      .lean();
    return doc ? new PropertyTenant(doc) : null;
  }

  /** Idempotent link: $addToSet ignores tenants already attached. */
  async attachToProperty(
    dbName: string,
    propertyId: string,
    tenantIds: string[],
  ): Promise<void> {
    const validIds = tenantIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (validIds.length === 0) return;
    await this.model(dbName).updateMany(
      { _id: { $in: validIds } },
      { $addToSet: { propertyIds: new Types.ObjectId(propertyId) } },
    );
  }

  async detachFromProperty(
    dbName: string,
    propertyId: string,
    tenantId: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(tenantId)) return false;
    const result = await this.model(dbName).updateOne(
      { _id: new Types.ObjectId(tenantId) },
      { $pull: { propertyIds: new Types.ObjectId(propertyId) } },
    );
    return result.modifiedCount > 0;
  }

  /** Unlink every tenant from a property (used when the property is deleted). */
  async detachAllFromProperty(
    dbName: string,
    propertyId: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(propertyId)) return;
    await this.model(dbName).updateMany(
      { propertyIds: new Types.ObjectId(propertyId) },
      { $pull: { propertyIds: new Types.ObjectId(propertyId) } },
    );
  }

  async delete(dbName: string, id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await this.model(dbName).deleteOne({
      _id: new Types.ObjectId(id),
    });
    return result.deletedCount > 0;
  }
}
