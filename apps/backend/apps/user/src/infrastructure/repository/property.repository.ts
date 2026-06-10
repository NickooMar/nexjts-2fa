import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Property } from '../../domain/entities/property.entity';
import {
  PropertyType,
  PropertySchema,
  PropertyDocument,
} from '../schemas/property.schema';
import { TenantConnectionService } from '../tenancy/tenant-connection.service';

export interface CreatePropertyRecord {
  name: string;
  slug: string;
  address: string;
  organizationId: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  type?: PropertyType;
  units?: number;
}

/**
 * Property data lives in the tenant's own database. Every method receives the
 * tenant `dbName` and resolves its model through {@link TenantConnectionService},
 * so reads/writes are physically isolated per tenant.
 */
@Injectable()
export class PropertyRepository {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  private model(dbName: string): Model<PropertyDocument> {
    return this.tenantConnection.getModel<PropertyDocument>(
      dbName,
      'Property',
      PropertySchema,
    );
  }

  async create(
    dbName: string,
    input: CreatePropertyRecord,
    createdBy?: string,
  ): Promise<Property> {
    const created = await this.model(dbName).create({
      _id: new Types.ObjectId(),
      name: input.name,
      slug: input.slug,
      description: input.description,
      address: input.address,
      city: input.city,
      state: input.state,
      country: input.country,
      postalCode: input.postalCode,
      type: input.type ?? 'apartment',
      units: input.units ?? 1,
      organizationId: new Types.ObjectId(input.organizationId),
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
    });
    return new Property(created.toObject());
  }

  async findAll(dbName: string): Promise<Property[]> {
    const docs = await this.model(dbName).find().sort({ createdAt: -1 }).lean();
    return docs.map((doc) => new Property(doc));
  }

  async findById(dbName: string, id: string): Promise<Property | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model(dbName)
      .findById(new Types.ObjectId(id))
      .lean();
    if (!doc) return null;
    return new Property(doc);
  }

  /** Resolve a property by Mongo id, public uuid, or slug. */
  async findByIdOrSlug(
    dbName: string,
    idOrSlug: string,
  ): Promise<Property | null> {
    const byId = await this.findById(dbName, idOrSlug);
    if (byId) return byId;
    const doc = await this.model(dbName)
      .findOne({ $or: [{ uuid: idOrSlug }, { slug: idOrSlug }] })
      .lean();
    if (!doc) return null;
    return new Property(doc);
  }

  async slugExists(
    dbName: string,
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    const filter: Record<string, unknown> = { slug };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const existing = await this.model(dbName).exists(filter);
    return existing !== null;
  }

  async update(
    dbName: string,
    id: string,
    changes: Partial<PropertyDocument>,
  ): Promise<Property | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model(dbName)
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: changes },
        { new: true, runValidators: true },
      )
      .lean();
    if (!doc) return null;
    return new Property(doc);
  }

  async delete(dbName: string, id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await this.model(dbName).deleteOne({
      _id: new Types.ObjectId(id),
    });
    return result.deletedCount > 0;
  }
}
