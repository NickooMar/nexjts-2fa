import { from, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { Tenant } from '../entities/tenant.entity';
import { CreateTenantDto } from 'libs/shared/dto/tenant/create-tenant.dto';
import { TenantRepository } from '../../infrastructure/repository/tenant.repository';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  create(input: CreateTenantDto): Observable<Tenant> {
    return from(this.tenantRepository.create(input));
  }

  findById(id: string): Observable<Tenant | null> {
    return from(this.tenantRepository.findById(id));
  }

  findBySlug(slug: string): Observable<Tenant | null> {
    return from(this.tenantRepository.findBySlug(slug));
  }
}
