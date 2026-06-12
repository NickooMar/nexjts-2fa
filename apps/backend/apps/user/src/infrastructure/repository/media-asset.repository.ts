import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { MediaAsset } from '../../domain/entities/media-asset.entity';
import {
  MediaAssetKind,
  MediaAssetSchema,
  MediaAssetDocument,
} from '../schemas/media-asset.schema';
import { TenantConnectionService } from '../tenancy/tenant-connection.service';

export interface CreateMediaAssetRecord {
  ownerType: string;
  ownerId: string;
  kind: MediaAssetKind;
  storageKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  order?: number;
  isCover?: boolean;
  uploadedBy?: string;
}

/**
 * Media metadata lives in the tenant's own database (same isolation model as
 * properties). Every method receives the tenant `dbName` and resolves its
 * model through {@link TenantConnectionService}.
 */
@Injectable()
export class MediaAssetRepository {
  constructor(private readonly tenantConnection: TenantConnectionService) {}

  private model(dbName: string): Model<MediaAssetDocument> {
    return this.tenantConnection.getModel<MediaAssetDocument>(
      dbName,
      'MediaAsset',
      MediaAssetSchema,
    );
  }

  async createMany(
    dbName: string,
    records: CreateMediaAssetRecord[],
  ): Promise<MediaAsset[]> {
    const docs = await this.model(dbName).create(
      records.map((record) => ({
        _id: new Types.ObjectId(),
        ownerType: record.ownerType,
        ownerId: new Types.ObjectId(record.ownerId),
        kind: record.kind,
        storageKey: record.storageKey,
        originalName: record.originalName,
        mimeType: record.mimeType,
        size: record.size,
        order: record.order ?? 0,
        isCover: record.isCover ?? false,
        uploadedBy: record.uploadedBy
          ? new Types.ObjectId(record.uploadedBy)
          : undefined,
      })),
    );
    return docs.map((doc) => new MediaAsset(doc.toObject()));
  }

  async findByOwner(
    dbName: string,
    ownerType: string,
    ownerId: string,
    kind?: MediaAssetKind,
  ): Promise<MediaAsset[]> {
    const docs = await this.model(dbName)
      .find({
        ownerType,
        ownerId: new Types.ObjectId(ownerId),
        ...(kind ? { kind } : {}),
      })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return docs.map((doc) => new MediaAsset(doc));
  }

  /** All assets for a set of owners, in bulk (grouped by owner id). */
  async findByOwners(
    dbName: string,
    ownerType: string,
    ownerIds: string[],
  ): Promise<Map<string, MediaAsset[]>> {
    if (ownerIds.length === 0) return new Map();
    const docs = await this.model(dbName)
      .find({
        ownerType,
        ownerId: { $in: ownerIds.map((id) => new Types.ObjectId(id)) },
      })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const byOwner = new Map<string, MediaAsset[]>();
    for (const doc of docs) {
      const key = String(doc.ownerId);
      const assets = byOwner.get(key) ?? [];
      assets.push(new MediaAsset(doc));
      byOwner.set(key, assets);
    }
    return byOwner;
  }

  /** Cover image (or first image as fallback) for a set of owners, in bulk. */
  async findCoversForOwners(
    dbName: string,
    ownerType: string,
    ownerIds: string[],
  ): Promise<Map<string, MediaAsset>> {
    if (ownerIds.length === 0) return new Map();
    const docs = await this.model(dbName)
      .find({
        ownerType,
        kind: 'image',
        ownerId: { $in: ownerIds.map((id) => new Types.ObjectId(id)) },
      })
      .sort({ isCover: -1, order: 1, createdAt: -1 })
      .lean();

    const covers = new Map<string, MediaAsset>();
    for (const doc of docs) {
      const key = String(doc.ownerId);
      if (!covers.has(key)) covers.set(key, new MediaAsset(doc));
    }
    return covers;
  }

  async findById(
    dbName: string,
    ownerType: string,
    ownerId: string,
    mediaId: string,
  ): Promise<MediaAsset | null> {
    if (!Types.ObjectId.isValid(mediaId)) return null;
    const doc = await this.model(dbName)
      .findOne({
        _id: new Types.ObjectId(mediaId),
        ownerType,
        ownerId: new Types.ObjectId(ownerId),
      })
      .lean();
    return doc ? new MediaAsset(doc) : null;
  }

  async countByOwner(
    dbName: string,
    ownerType: string,
    ownerId: string,
    kind: MediaAssetKind,
  ): Promise<number> {
    return this.model(dbName).countDocuments({
      ownerType,
      kind,
      ownerId: new Types.ObjectId(ownerId),
    });
  }

  /** Total stored bytes across the tenant database (storage usage). */
  async totalSize(dbName: string): Promise<number> {
    const [result] = await this.model(dbName).aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: '$size' } } },
    ]);
    return result?.total ?? 0;
  }

  async maxOrder(
    dbName: string,
    ownerType: string,
    ownerId: string,
  ): Promise<number> {
    const doc = await this.model(dbName)
      .findOne({ ownerType, ownerId: new Types.ObjectId(ownerId) })
      .sort({ order: -1 })
      .select('order')
      .lean();
    return doc?.order ?? -1;
  }

  async delete(dbName: string, mediaId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(mediaId)) return false;
    const result = await this.model(dbName).deleteOne({
      _id: new Types.ObjectId(mediaId),
    });
    return result.deletedCount > 0;
  }

  /** Remove every asset for an owner; returns them for storage cleanup. */
  async deleteByOwner(
    dbName: string,
    ownerType: string,
    ownerId: string,
  ): Promise<MediaAsset[]> {
    const assets = await this.findByOwner(dbName, ownerType, ownerId);
    if (assets.length > 0) {
      await this.model(dbName).deleteMany({
        ownerType,
        ownerId: new Types.ObjectId(ownerId),
      });
    }
    return assets;
  }

  async setCover(
    dbName: string,
    ownerType: string,
    ownerId: string,
    mediaId: string,
  ): Promise<MediaAsset | null> {
    if (!Types.ObjectId.isValid(mediaId)) return null;
    const owner = new Types.ObjectId(ownerId);
    await this.model(dbName).updateMany(
      { ownerType, ownerId: owner, kind: 'image' },
      { $set: { isCover: false } },
    );
    const doc = await this.model(dbName)
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(mediaId),
          ownerType,
          ownerId: owner,
          kind: 'image',
        },
        { $set: { isCover: true } },
        { new: true },
      )
      .lean();
    return doc ? new MediaAsset(doc) : null;
  }

  /** Promote the first remaining image to cover (after a cover delete). */
  async promoteFirstImageToCover(
    dbName: string,
    ownerType: string,
    ownerId: string,
  ): Promise<void> {
    const doc = await this.model(dbName)
      .findOne({ ownerType, ownerId: new Types.ObjectId(ownerId), kind: 'image' })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    if (doc) {
      await this.model(dbName).updateOne(
        { _id: doc._id },
        { $set: { isCover: true } },
      );
    }
  }

  async reorder(
    dbName: string,
    ownerType: string,
    ownerId: string,
    orderedIds: string[],
  ): Promise<void> {
    const owner = new Types.ObjectId(ownerId);
    const operations = orderedIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id, index) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(id), ownerType, ownerId: owner },
          update: { $set: { order: index } },
        },
      }));
    if (operations.length > 0) {
      await this.model(dbName).bulkWrite(operations);
    }
  }
}
