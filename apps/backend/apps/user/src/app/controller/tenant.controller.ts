import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { TenantPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { Tenant } from '../../domain/entities/tenant.entity';
import { CreateTenantDto } from 'libs/shared/dto/tenant/create-tenant.dto';
import { TenantService } from '../../domain/services/tenant.service';

@Controller()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @MessagePattern({ cmd: TenantPatterns.CREATE })
  create(input: CreateTenantDto): Observable<Tenant> {
    return this.tenantService.create(input);
  }

  @MessagePattern({ cmd: TenantPatterns.FIND_BY_ID })
  findById(id: string): Observable<Tenant | null> {
    return this.tenantService.findById(id);
  }

  @MessagePattern({ cmd: TenantPatterns.FIND_BY_SLUG })
  findBySlug(slug: string): Observable<Tenant | null> {
    return this.tenantService.findBySlug(slug);
  }
}
