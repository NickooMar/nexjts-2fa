import {
  Get,
  Body,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  Controller,
  UploadedFiles,
  UseInterceptors,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  MediaOwnerTypes,
  BillingEventPatterns,
  ROLES_THAT_MANAGE_PROPERTIES,
} from 'apps/constants';
import { StorageService } from 'libs/storage/storage.service';
import { PlanEnforcementService } from '../billing/plan-enforcement.service';
import { BillingProxy } from 'apps/billing/src/infrastructure/external/billing.proxy';
import {
  MediaKind,
  MediaKinds,
  sanitizeFilename,
  MAX_UPLOAD_SIZE_BYTES,
  validateUploadedFiles,
} from 'libs/storage/file-validation';
import { MediaProxy, MediaFileMetadata } from './media.proxy';
import { MediaUrlService } from './media-url.service';
import { PropertyProxy } from '../properties/property.proxy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReorderMediaDto } from 'libs/shared/dto/media/reorder-media.dto';
import {
  CurrentTenant,
  TenantContext,
} from '../common/decorators/current-tenant.decorator';

interface AuthUser {
  _id: string;
  role: string;
  tenantId: string;
}

/** Multer batch ceiling; per-kind limits are enforced in the validator. */
const UPLOAD_INTERCEPTOR_OPTIONS = {
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES, files: 15 },
};

/**
 * Property media endpoints. The gateway owns the storage round-trip (bytes in
 * and out of S3/MinIO); the user service owns the metadata records in the
 * tenant database. Reads are open to any member; writes require the same
 * roles that manage properties.
 */
@Controller({ path: 'properties/:idOrSlug', version: '1' })
@UseGuards(JwtAuthGuard)
export class PropertyMediaController {
  constructor(
    private readonly storage: StorageService,
    private readonly mediaProxy: MediaProxy,
    private readonly mediaUrl: MediaUrlService,
    private readonly propertyProxy: PropertyProxy,
    private readonly billingProxy: BillingProxy,
    private readonly planEnforcement: PlanEnforcementService,
  ) {}

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 15, UPLOAD_INTERCEPTOR_OPTIONS))
  async uploadImages(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    this.assertCanManage(user);
    return this.uploadMedia(tenant, idOrSlug, files, MediaKinds.IMAGE);
  }

  @Post('documents')
  @UseInterceptors(FilesInterceptor('files', 10, UPLOAD_INTERCEPTOR_OPTIONS))
  async uploadDocuments(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    this.assertCanManage(user);
    return this.uploadMedia(tenant, idOrSlug, files, MediaKinds.DOCUMENT);
  }

  @Patch('images/reorder')
  async reorderImages(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Body() input: ReorderMediaDto,
  ) {
    this.assertCanManage(user);
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);
    const images = await firstValueFrom(
      this.mediaProxy.reorder({
        dbName: tenant.dbName,
        ownerType: MediaOwnerTypes.PROPERTY,
        ownerId: String(property._id),
        orderedIds: input.orderedIds,
      }),
    ).catch(this.mapMediaError('Failed to reorder images'));
    return { success: true, images: await this.mediaUrl.toClientAssets(images) };
  }

  @Patch('images/:mediaId/cover')
  async setCover(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Param('mediaId') mediaId: string,
  ) {
    this.assertCanManage(user);
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);
    const image = await firstValueFrom(
      this.mediaProxy.setCover({
        dbName: tenant.dbName,
        ownerType: MediaOwnerTypes.PROPERTY,
        ownerId: String(property._id),
        mediaId,
      }),
    ).catch(this.mapMediaError('Failed to set cover image'));
    return { success: true, image: await this.mediaUrl.toClientAsset(image) };
  }

  /** Fresh signed URL that forces a download with the original filename. */
  @Get('documents/:mediaId/download')
  async downloadDocument(
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Param('mediaId') mediaId: string,
  ) {
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);
    const document = (property.documents ?? []).find(
      (asset: any) => String(asset._id) === mediaId || asset.uuid === mediaId,
    );
    if (!document) throw new NotFoundException('media_not_found');

    const url = await this.storage.resolveDownloadUrl(
      document.storageKey,
      document.originalName,
    );
    return { success: true, url };
  }

  /** Removes one media asset (image or document): bucket object + metadata. */
  @Delete('media/:mediaId')
  async deleteMedia(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Param('mediaId') mediaId: string,
  ) {
    this.assertCanManage(user);
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);

    const removed = await firstValueFrom(
      this.mediaProxy.remove({
        dbName: tenant.dbName,
        ownerType: MediaOwnerTypes.PROPERTY,
        ownerId: String(property._id),
        mediaId,
      }),
    ).catch(this.mapMediaError('Failed to delete media'));

    // Metadata is already gone; a failed object delete must not fail the
    // request. Orphaned objects are unreachable (keys are never reused).
    await this.storage.delete(removed.storageKey).catch(() => undefined);

    this.billingProxy.emitUsageEvent(BillingEventPatterns.FILE_DELETED, {
      organizationId: tenant.tenantId,
      bytes: removed.size ?? 0,
    });

    return { success: true, deleted: true };
  }

  private assertCanManage(user: AuthUser): void {
    if (!ROLES_THAT_MANAGE_PROPERTIES.includes(user.role as never)) {
      throw new ForbiddenException('insufficient_permissions');
    }
  }

  private async resolveProperty(dbName: string, idOrSlug: string) {
    return firstValueFrom(this.propertyProxy.findOne(dbName, idOrSlug)).catch(
      () => {
        throw new NotFoundException('property_not_found');
      },
    );
  }

  private mapMediaError(fallback: string) {
    return (error: any): never => {
      const message = error?.message || fallback;
      if (message.includes('media_not_found')) {
        throw new NotFoundException('media_not_found');
      }
      throw new InternalServerErrorException(message);
    };
  }

  /**
   * Shared upload flow: validate → put objects in the bucket → persist
   * metadata. Any failure rolls back the objects uploaded so far, so a
   * rejected batch never leaves orphans behind.
   */
  private async uploadMedia(
    tenant: TenantContext,
    idOrSlug: string,
    files: Express.Multer.File[],
    kind: MediaKind,
  ) {
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);
    const existing =
      kind === MediaKinds.IMAGE
        ? (property.images?.length ?? 0)
        : (property.documents?.length ?? 0);

    validateUploadedFiles(files, kind, existing);

    // Plan enforcement: total storage (bytes) + monthly upload meter. Runs
    // before any byte reaches the bucket.
    const totalBytes = files.reduce((sum, file) => sum + (file.size ?? 0), 0);
    await this.planEnforcement.assertCanUploadFiles(
      tenant.tenantId,
      files.length,
      totalBytes,
    );

    const uploaded: MediaFileMetadata[] = [];
    try {
      for (const file of files) {
        const storageKey = this.storage.buildKey({
          tenantSegment: tenant.tenantId,
          ownerType: MediaOwnerTypes.PROPERTY,
          ownerId: String(property._id),
          kind,
          originalName: file.originalname,
        });
        await this.storage.upload({
          key: storageKey,
          body: file.buffer,
          contentType: file.mimetype,
          originalName: file.originalname,
        });
        uploaded.push({
          storageKey,
          originalName: sanitizeFilename(file.originalname),
          mimeType: file.mimetype,
          size: file.size,
        });
      }

      const assets = await firstValueFrom(
        this.mediaProxy.add({
          dbName: tenant.dbName,
          ownerType: MediaOwnerTypes.PROPERTY,
          ownerId: String(property._id),
          kind,
          uploadedBy: tenant.userId,
          files: uploaded,
        }),
      );

      this.billingProxy.emitUsageEvent(BillingEventPatterns.FILE_UPLOADED, {
        organizationId: tenant.tenantId,
        quantity: uploaded.length,
        bytes: totalBytes,
      });

      const key = kind === MediaKinds.IMAGE ? 'images' : 'documents';
      return {
        success: true,
        [key]: await this.mediaUrl.toClientAssets(assets),
      };
    } catch (error) {
      await this.storage
        .deleteMany(uploaded.map((file) => file.storageKey))
        .catch(() => undefined);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        error?.message || 'upload_failed',
      );
    }
  }
}
