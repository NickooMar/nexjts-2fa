import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { MediaPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { MediaAsset } from '../../domain/entities/media-asset.entity';
import { MediaAssetKind } from '../../infrastructure/schemas/media-asset.schema';
import { MediaService, AddMediaInput } from '../../domain/services/media.service';

/**
 * Tenant-scoped media metadata handlers. As with properties, every payload
 * carries the tenant `dbName` resolved by the gateway from the JWT — never
 * from the client.
 */
@Controller()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @MessagePattern({ cmd: MediaPatterns.ADD })
  add(payload: { dbName: string } & AddMediaInput): Observable<MediaAsset[]> {
    const { dbName, ...input } = payload;
    return this.mediaService.add(dbName, input);
  }

  @MessagePattern({ cmd: MediaPatterns.LIST })
  list(payload: {
    dbName: string;
    ownerType: string;
    ownerId: string;
    kind?: MediaAssetKind;
  }): Observable<MediaAsset[]> {
    return this.mediaService.list(
      payload.dbName,
      payload.ownerType,
      payload.ownerId,
      payload.kind,
    );
  }

  @MessagePattern({ cmd: MediaPatterns.COUNT })
  count(payload: {
    dbName: string;
    ownerType: string;
    ownerId: string;
    kind: MediaAssetKind;
  }): Observable<number> {
    return this.mediaService.count(
      payload.dbName,
      payload.ownerType,
      payload.ownerId,
      payload.kind,
    );
  }

  @MessagePattern({ cmd: MediaPatterns.TOTAL_SIZE })
  totalSize(payload: { dbName: string }): Observable<number> {
    return this.mediaService.totalSize(payload.dbName);
  }

  @MessagePattern({ cmd: MediaPatterns.REMOVE })
  remove(payload: {
    dbName: string;
    ownerType: string;
    ownerId: string;
    mediaId: string;
  }): Observable<MediaAsset> {
    return this.mediaService.remove(
      payload.dbName,
      payload.ownerType,
      payload.ownerId,
      payload.mediaId,
    );
  }

  @MessagePattern({ cmd: MediaPatterns.SET_COVER })
  setCover(payload: {
    dbName: string;
    ownerType: string;
    ownerId: string;
    mediaId: string;
  }): Observable<MediaAsset> {
    return this.mediaService.setCover(
      payload.dbName,
      payload.ownerType,
      payload.ownerId,
      payload.mediaId,
    );
  }

  @MessagePattern({ cmd: MediaPatterns.REORDER })
  reorder(payload: {
    dbName: string;
    ownerType: string;
    ownerId: string;
    orderedIds: string[];
  }): Observable<MediaAsset[]> {
    return this.mediaService.reorder(
      payload.dbName,
      payload.ownerType,
      payload.ownerId,
      payload.orderedIds,
    );
  }
}
