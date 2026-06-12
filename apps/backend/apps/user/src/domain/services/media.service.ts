import { from, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { MediaAsset } from '../entities/media-asset.entity';
import { MediaAssetKind } from '../../infrastructure/schemas/media-asset.schema';
import {
  MediaAssetRepository,
  CreateMediaAssetRecord,
} from '../../infrastructure/repository/media-asset.repository';

export interface AddMediaInput {
  ownerType: string;
  ownerId: string;
  kind: MediaAssetKind;
  uploadedBy?: string;
  files: Array<{
    storageKey: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
}

/**
 * Owns media metadata invariants: append-to-end ordering, "exactly one cover
 * image per owner", and cover promotion on delete. Storage bytes are the
 * gateway's responsibility — this service only ever sees keys.
 */
@Injectable()
export class MediaService {
  constructor(private readonly mediaRepository: MediaAssetRepository) {}

  add(dbName: string, input: AddMediaInput): Observable<MediaAsset[]> {
    return from(
      (async () => {
        const [maxOrder, imageCount] = await Promise.all([
          this.mediaRepository.maxOrder(dbName, input.ownerType, input.ownerId),
          input.kind === 'image'
            ? this.mediaRepository.countByOwner(
                dbName,
                input.ownerType,
                input.ownerId,
                'image',
              )
            : Promise.resolve(0),
        ]);

        const records: CreateMediaAssetRecord[] = input.files.map(
          (file, index) => ({
            ownerType: input.ownerType,
            ownerId: input.ownerId,
            kind: input.kind,
            storageKey: file.storageKey,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            order: maxOrder + 1 + index,
            // First image an owner ever gets becomes the cover automatically.
            isCover: input.kind === 'image' && imageCount === 0 && index === 0,
            uploadedBy: input.uploadedBy,
          }),
        );

        return this.mediaRepository.createMany(dbName, records);
      })(),
    );
  }

  list(
    dbName: string,
    ownerType: string,
    ownerId: string,
    kind?: MediaAssetKind,
  ): Observable<MediaAsset[]> {
    return from(
      this.mediaRepository.findByOwner(dbName, ownerType, ownerId, kind),
    );
  }

  count(
    dbName: string,
    ownerType: string,
    ownerId: string,
    kind: MediaAssetKind,
  ): Observable<number> {
    return from(
      this.mediaRepository.countByOwner(dbName, ownerType, ownerId, kind),
    );
  }

  /** Total stored bytes for the whole tenant (billing storage usage). */
  totalSize(dbName: string): Observable<number> {
    return from(this.mediaRepository.totalSize(dbName));
  }

  /** Returns the removed asset so the caller can purge the bucket object. */
  remove(
    dbName: string,
    ownerType: string,
    ownerId: string,
    mediaId: string,
  ): Observable<MediaAsset> {
    return from(
      (async () => {
        const asset = await this.mediaRepository.findById(
          dbName,
          ownerType,
          ownerId,
          mediaId,
        );
        if (!asset) throw new RpcException('media_not_found');

        await this.mediaRepository.delete(dbName, mediaId);
        if (asset.isCover) {
          await this.mediaRepository.promoteFirstImageToCover(
            dbName,
            ownerType,
            ownerId,
          );
        }
        return asset;
      })(),
    );
  }

  setCover(
    dbName: string,
    ownerType: string,
    ownerId: string,
    mediaId: string,
  ): Observable<MediaAsset> {
    return from(
      (async () => {
        const updated = await this.mediaRepository.setCover(
          dbName,
          ownerType,
          ownerId,
          mediaId,
        );
        if (!updated) throw new RpcException('media_not_found');
        return updated;
      })(),
    );
  }

  reorder(
    dbName: string,
    ownerType: string,
    ownerId: string,
    orderedIds: string[],
  ): Observable<MediaAsset[]> {
    return from(
      (async () => {
        await this.mediaRepository.reorder(
          dbName,
          ownerType,
          ownerId,
          orderedIds,
        );
        return this.mediaRepository.findByOwner(
          dbName,
          ownerType,
          ownerId,
          'image',
        );
      })(),
    );
  }
}
