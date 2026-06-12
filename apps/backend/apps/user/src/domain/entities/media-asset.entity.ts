import { BaseEntity } from 'libs/shared/repositories/base.entity';
import { MediaAssetKind } from '../../infrastructure/schemas/media-asset.schema';

export class MediaAsset extends BaseEntity {
  _id: any;

  uuid: string;

  ownerType: string;

  ownerId: any;

  kind: MediaAssetKind;

  storageKey: string;

  originalName: string;

  mimeType: string;

  size: number;

  order: number;

  isCover: boolean;

  uploadedBy?: any;

  createdAt: Date;

  updatedAt: Date;
}
