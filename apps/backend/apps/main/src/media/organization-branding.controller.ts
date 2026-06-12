import {
  Get,
  Put,
  Param,
  Delete,
  UseGuards,
  Controller,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaOwnerTypes, ROLES_THAT_MANAGE_MEMBERS } from 'apps/constants';
import { StorageService } from 'libs/storage/storage.service';
import {
  MediaKinds,
  MAX_UPLOAD_SIZE_BYTES,
  validateUploadedFiles,
} from 'libs/storage/file-validation';
import { MediaProxy } from './media.proxy';
import { MediaUrlService } from './media-url.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CurrentTenant,
  TenantContext,
} from '../common/decorators/current-tenant.decorator';

interface AuthUser {
  _id: string;
  role: string;
  tenantId: string;
}

type BrandingSlot = 'logo' | 'banner';

const SLOT_FIELDS: Record<BrandingSlot, 'logoKey' | 'bannerKey'> = {
  logo: 'logoKey',
  banner: 'bannerKey',
};

/**
 * Organization branding (logo + banner). Single-slot images stored on the
 * control-plane tenant document as storage keys; uploading replaces the slot
 * and purges the previous object. Owner/admin only for writes.
 */
@Controller({ path: 'organizations/branding', version: '1' })
@UseGuards(JwtAuthGuard)
export class OrganizationBrandingController {
  constructor(
    private readonly storage: StorageService,
    private readonly mediaProxy: MediaProxy,
    private readonly mediaUrl: MediaUrlService,
  ) {}

  /** Current organization's branding, with resolved URLs. Any member. */
  @Get()
  async getBranding(@CurrentTenant() tenant: TenantContext) {
    const current = await firstValueFrom(
      this.mediaProxy.findTenant(tenant.tenantId),
    );
    if (!current) throw new NotFoundException('organization_not_found');

    const enriched = await this.mediaUrl.enrichTenantBranding(current);
    return {
      success: true,
      branding: {
        logoUrl: enriched.logoUrl ?? null,
        bannerUrl: enriched.bannerUrl ?? null,
      },
    };
  }

  @Put(':slot')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_SIZE_BYTES } }),
  )
  async uploadBranding(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('slot') slot: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.assertCanManage(user);
    const field = this.resolveSlot(slot);
    validateUploadedFiles(file ? [file] : [], MediaKinds.IMAGE);

    const storageKey = this.storage.buildKey({
      tenantSegment: tenant.tenantId,
      ownerType: MediaOwnerTypes.ORGANIZATION,
      ownerId: tenant.tenantId,
      kind: MediaKinds.IMAGE,
      originalName: file.originalname,
    });

    try {
      await this.storage.upload({
        key: storageKey,
        body: file.buffer,
        contentType: file.mimetype,
        originalName: file.originalname,
      });

      const { previousKey } = await firstValueFrom(
        this.mediaProxy.updateTenantBranding({
          tenantId: tenant.tenantId,
          field,
          storageKey,
        }),
      );

      // Replaced object is unreachable now; purge it best-effort.
      if (previousKey) {
        await this.storage.delete(previousKey).catch(() => undefined);
      }

      return {
        success: true,
        [`${slot}Url`]: await this.storage.resolveUrl(storageKey),
      };
    } catch (error) {
      await this.storage.delete(storageKey).catch(() => undefined);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        error?.message || 'upload_failed',
      );
    }
  }

  @Delete(':slot')
  async removeBranding(
    @CurrentUser() user: AuthUser,
    @CurrentTenant() tenant: TenantContext,
    @Param('slot') slot: string,
  ) {
    this.assertCanManage(user);
    const field = this.resolveSlot(slot);

    const { previousKey } = await firstValueFrom(
      this.mediaProxy.updateTenantBranding({
        tenantId: tenant.tenantId,
        field,
        storageKey: null,
      }),
    ).catch(() => {
      throw new NotFoundException('organization_not_found');
    });

    if (previousKey) {
      await this.storage.delete(previousKey).catch(() => undefined);
    }
    return { success: true };
  }

  private assertCanManage(user: AuthUser): void {
    if (!ROLES_THAT_MANAGE_MEMBERS.includes(user.role as never)) {
      throw new ForbiddenException('insufficient_permissions');
    }
  }

  private resolveSlot(slot: string): 'logoKey' | 'bannerKey' {
    const field = SLOT_FIELDS[slot as BrandingSlot];
    if (!field) throw new BadRequestException('invalid_branding_slot');
    return field;
  }
}
