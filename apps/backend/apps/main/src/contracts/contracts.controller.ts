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
import { MediaOwnerTypes, ROLES_THAT_MANAGE_PROPERTIES } from 'apps/constants';
import { StorageService } from 'libs/storage/storage.service';
import {
  MediaKind,
  MediaKinds,
  sanitizeFilename,
  MAX_UPLOAD_SIZE_BYTES,
  validateUploadedFiles,
} from 'libs/storage/file-validation';
import { ContractProxy } from './contract.proxy';
import { MediaUrlService } from '../media/media-url.service';
import { MediaProxy, MediaFileMetadata } from '../media/media.proxy';
import { PropertyProxy } from '../properties/property.proxy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateContractDto } from 'libs/shared/dto/contract/create-contract.dto';
import { UpdateContractDto } from 'libs/shared/dto/contract/update-contract.dto';
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
 * Contract endpoints, nested under the owning property. As with property
 * media, the gateway owns the storage round-trip while the user service owns
 * the records in the tenant database. Reads are open to any member; writes
 * require the same roles that manage properties.
 */
@Controller({ path: 'properties/:idOrSlug/contracts', version: '1' })
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(
    private readonly storage: StorageService,
    private readonly mediaProxy: MediaProxy,
    private readonly mediaUrl: MediaUrlService,
    private readonly contractProxy: ContractProxy,
    private readonly propertyProxy: PropertyProxy,
  ) {}

  @Get()
  async findByProperty(
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
  ) {
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);
    const contracts = await firstValueFrom(
      this.contractProxy.findByProperty(tenant.dbName, String(property._id)),
    ).catch(this.mapContractError('Failed to list contracts'));
    return {
      success: true,
      contracts: await this.mediaUrl.enrichContracts(contracts),
    };
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Body() input: CreateContractDto,
  ) {
    this.assertCanManage(user);
    const property = await this.resolveProperty(tenant.dbName, idOrSlug);
    const contract = await firstValueFrom(
      this.contractProxy.create(
        tenant.dbName,
        String(property._id),
        input,
        tenant.userId,
      ),
    ).catch(this.mapContractError('Failed to create contract'));
    return { success: true, contract };
  }

  @Patch(':contractId')
  async update(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Param('contractId') contractId: string,
    @Body() input: UpdateContractDto,
  ) {
    this.assertCanManage(user);
    await this.resolveContract(tenant.dbName, idOrSlug, contractId);
    const contract = await firstValueFrom(
      this.contractProxy.update(tenant.dbName, contractId, input),
    ).catch(this.mapContractError('Failed to update contract'));
    return { success: true, contract };
  }

  @Delete(':contractId')
  async delete(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Param('contractId') contractId: string,
  ) {
    this.assertCanManage(user);
    await this.resolveContract(tenant.dbName, idOrSlug, contractId);
    const result = await firstValueFrom(
      this.contractProxy.delete(tenant.dbName, contractId),
    ).catch(this.mapContractError('Failed to delete contract'));

    // Metadata records are gone; purge the orphaned bucket objects
    // best-effort (a failure here must not fail the delete).
    const mediaKeys: string[] = result?.mediaKeys ?? [];
    if (mediaKeys.length > 0) {
      void this.storage.deleteMany(mediaKeys).catch(() => undefined);
    }
    return { success: true, deleted: result?.deleted ?? true };
  }

  @Post(':contractId/images')
  @UseInterceptors(FilesInterceptor('files', 15, UPLOAD_INTERCEPTOR_OPTIONS))
  async uploadImages(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Param('contractId') contractId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    this.assertCanManage(user);
    return this.uploadMedia(
      tenant,
      idOrSlug,
      contractId,
      files,
      MediaKinds.IMAGE,
    );
  }

  @Post(':contractId/documents')
  @UseInterceptors(FilesInterceptor('files', 10, UPLOAD_INTERCEPTOR_OPTIONS))
  async uploadDocuments(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Param('contractId') contractId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    this.assertCanManage(user);
    return this.uploadMedia(
      tenant,
      idOrSlug,
      contractId,
      files,
      MediaKinds.DOCUMENT,
    );
  }

  /** Fresh signed URL that forces a download with the original filename. */
  @Get(':contractId/documents/:mediaId/download')
  async downloadDocument(
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Param('contractId') contractId: string,
    @Param('mediaId') mediaId: string,
  ) {
    const contract = await this.resolveContract(
      tenant.dbName,
      idOrSlug,
      contractId,
    );
    const document = (contract.documents ?? []).find(
      (asset: any) => String(asset._id) === mediaId || asset.uuid === mediaId,
    );
    if (!document) throw new NotFoundException('media_not_found');

    const url = await this.storage.resolveDownloadUrl(
      document.storageKey,
      document.originalName,
    );
    return { success: true, url };
  }

  /** Removes one contract media asset: bucket object + metadata. */
  @Delete(':contractId/media/:mediaId')
  async deleteMedia(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('idOrSlug') idOrSlug: string,
    @Param('contractId') contractId: string,
    @Param('mediaId') mediaId: string,
  ) {
    this.assertCanManage(user);
    const contract = await this.resolveContract(
      tenant.dbName,
      idOrSlug,
      contractId,
    );

    const removed = await firstValueFrom(
      this.mediaProxy.remove({
        dbName: tenant.dbName,
        ownerType: MediaOwnerTypes.CONTRACT,
        ownerId: String(contract._id),
        mediaId,
      }),
    ).catch(this.mapContractError('Failed to delete media'));

    await this.storage.delete(removed.storageKey).catch(() => undefined);

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

  /** Resolves the contract and verifies it belongs to the property in the URL. */
  private async resolveContract(
    dbName: string,
    idOrSlug: string,
    contractId: string,
  ) {
    const property = await this.resolveProperty(dbName, idOrSlug);
    const contract = await firstValueFrom(
      this.contractProxy.findOne(dbName, contractId),
    ).catch(() => {
      throw new NotFoundException('contract_not_found');
    });
    if (String(contract.propertyId) !== String(property._id)) {
      throw new NotFoundException('contract_not_found');
    }
    return contract;
  }

  private mapContractError(fallback: string) {
    return (error: any): never => {
      const message = error?.message || fallback;
      if (message.includes('contract_not_found')) {
        throw new NotFoundException('contract_not_found');
      }
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
    contractId: string,
    files: Express.Multer.File[],
    kind: MediaKind,
  ) {
    const contract = await this.resolveContract(
      tenant.dbName,
      idOrSlug,
      contractId,
    );
    const existing =
      kind === MediaKinds.IMAGE
        ? (contract.images?.length ?? 0)
        : (contract.documents?.length ?? 0);

    validateUploadedFiles(files, kind, existing);

    const uploaded: MediaFileMetadata[] = [];
    try {
      for (const file of files) {
        const storageKey = this.storage.buildKey({
          tenantSegment: tenant.tenantId,
          ownerType: MediaOwnerTypes.CONTRACT,
          ownerId: String(contract._id),
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
          ownerType: MediaOwnerTypes.CONTRACT,
          ownerId: String(contract._id),
          kind,
          uploadedBy: tenant.userId,
          files: uploaded,
        }),
      );

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
