import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

export type MediaAssetKind = 'image' | 'document';

/**
 * Generic media metadata record, stored in the tenant's own database next to
 * the entities that own it. The actual bytes live in object storage
 * (S3/MinIO) under `storageKey`; this document is the source of truth for
 * ownership, ordering and display metadata.
 *
 * `ownerType`/`ownerId` make the collection reusable for any entity —
 * properties today, units/contracts/users tomorrow — without schema changes.
 */
@Schema({ timestamps: true })
export class MediaAssetDocument {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, default: randomUUID })
  uuid: string;

  @Prop({ type: String, required: true, index: true })
  ownerType: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: ['image', 'document'] })
  kind: MediaAssetKind;

  /** Object key in the bucket — never derived from user input. */
  @Prop({ type: String, required: true, unique: true })
  storageKey: string;

  @Prop({ type: String, required: true, trim: true })
  originalName: string;

  @Prop({ type: String, required: true })
  mimeType: string;

  /** Size in bytes as received at upload time. */
  @Prop({ type: Number, required: true, min: 0 })
  size: number;

  /** Gallery position (images only; documents sort by recency). */
  @Prop({ type: Number, required: true, default: 0 })
  order: number;

  /** At most one image per owner is the cover — enforced in the service. */
  @Prop({ type: Boolean, required: true, default: false })
  isCover: boolean;

  @Prop({ type: Types.ObjectId, required: false })
  uploadedBy?: Types.ObjectId;
}

export const MediaAssetSchema =
  SchemaFactory.createForClass(MediaAssetDocument);

MediaAssetSchema.index({ ownerType: 1, ownerId: 1, kind: 1, order: 1 });
