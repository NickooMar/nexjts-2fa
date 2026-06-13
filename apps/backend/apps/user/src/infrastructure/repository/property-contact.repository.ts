import { Model, Schema, Types } from 'mongoose';
import { PropertyContact } from '../../domain/entities/property-contact.entity';
import { PropertyContactDocument } from '../schemas/property-contact.schema';
import { TenantConnectionService } from '../tenancy/tenant-connection.service';

export interface CreatePropertyContactRecord {
  fullName: string;
  email?: string;
  phone?: string;
  documentId?: string;
  notes?: string;
  /** Properties the contact is linked to from day one (optional). */
  propertyIds?: string[];
}

/**
 * Shared data access for people linked to properties (renters and owners).
 * Concrete repositories — {@link PropertyTenantRepository},
 * `PropertyOwnerRepository` — bind this to their own collection by supplying a
 * `modelName`/`schema` and an entity factory. Every method receives the tenant
 * `dbName` and resolves its model through {@link TenantConnectionService}.
 */
export abstract class PropertyContactRepository<
  TEntity extends PropertyContact = PropertyContact,
> {
  constructor(protected readonly tenantConnection: TenantConnectionService) {}

  /** Mongoose model name (= collection) backing this roster. */
  protected abstract readonly modelName: string;
  /** Schema compiled for the collection. */
  protected abstract readonly schema: Schema;
  /** Wrap a lean document in the concrete domain entity. */
  protected abstract toEntity(doc: unknown): TEntity;

  protected model(dbName: string): Model<PropertyContactDocument> {
    return this.tenantConnection.getModel<PropertyContactDocument>(
      dbName,
      this.modelName,
      this.schema,
    );
  }

  async create(
    dbName: string,
    input: CreatePropertyContactRecord,
    createdBy?: string,
  ): Promise<TEntity> {
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
    return this.toEntity(created.toObject());
  }

  async findAll(dbName: string): Promise<TEntity[]> {
    const docs = await this.model(dbName).find().sort({ fullName: 1 }).lean();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findByProperty(
    dbName: string,
    propertyId: string,
  ): Promise<TEntity[]> {
    if (!Types.ObjectId.isValid(propertyId)) return [];
    const docs = await this.model(dbName)
      .find({ propertyIds: new Types.ObjectId(propertyId) })
      .sort({ fullName: 1 })
      .lean();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findByIdOrUuid(dbName: string, id: string): Promise<TEntity | null> {
    const filter = Types.ObjectId.isValid(id)
      ? { _id: new Types.ObjectId(id) }
      : { uuid: id };
    const doc = await this.model(dbName).findOne(filter).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async update(
    dbName: string,
    id: string,
    changes: Record<string, unknown>,
  ): Promise<TEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model(dbName)
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { $set: changes },
        { new: true, runValidators: true },
      )
      .lean();
    return doc ? this.toEntity(doc) : null;
  }

  /** Idempotent link: $addToSet ignores contacts already attached. */
  async attachToProperty(
    dbName: string,
    propertyId: string,
    contactIds: string[],
  ): Promise<void> {
    const validIds = contactIds
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
    contactId: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(contactId)) return false;
    const result = await this.model(dbName).updateOne(
      { _id: new Types.ObjectId(contactId) },
      { $pull: { propertyIds: new Types.ObjectId(propertyId) } },
    );
    return result.modifiedCount > 0;
  }

  /** Unlink every contact from a property (used when the property is deleted). */
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
