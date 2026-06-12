import { Observable, from } from 'rxjs';
import { Controller } from '@nestjs/common';
import { BillingPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { Plan } from '../../domain/entities/plan.entity';
import { PlanService } from '../../domain/services/plan.service';
import { CreatePlanDto } from 'libs/shared/dto/billing/create-plan.dto';
import { UpdatePlanDto } from 'libs/shared/dto/billing/update-plan.dto';

/**
 * Plan catalog management. List/get are consumed by the gateway; the write
 * patterns make plans fully configurable via API (ops tooling/seeders) —
 * limits are data, never code.
 */
@Controller()
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @MessagePattern({ cmd: BillingPatterns.LIST_PLANS })
  list(): Observable<Plan[]> {
    return from(this.planService.listPublic());
  }

  @MessagePattern({ cmd: BillingPatterns.GET_PLAN })
  get(payload: { slug: string }): Observable<Plan> {
    return from(this.planService.getBySlug(payload.slug));
  }

  @MessagePattern({ cmd: BillingPatterns.CREATE_PLAN })
  create(payload: {
    data: CreatePlanDto;
    createdBy?: string;
  }): Observable<Plan> {
    return from(this.planService.create(payload.data, payload.createdBy));
  }

  @MessagePattern({ cmd: BillingPatterns.UPDATE_PLAN })
  update(payload: { id: string; data: UpdatePlanDto }): Observable<Plan> {
    return from(this.planService.update(payload.id, payload.data));
  }

  @MessagePattern({ cmd: BillingPatterns.ARCHIVE_PLAN })
  archive(payload: { id: string }): Observable<Plan> {
    return from(this.planService.archive(payload.id));
  }
}
