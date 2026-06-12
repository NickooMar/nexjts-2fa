import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Plan } from '../entities/plan.entity';
import { PlanRepository } from '../../infrastructure/repository/plan.repository';
import { CreatePlanDto } from 'libs/shared/dto/billing/create-plan.dto';
import { UpdatePlanDto } from 'libs/shared/dto/billing/update-plan.dto';

@Injectable()
export class PlanService {
  constructor(private readonly planRepository: PlanRepository) {}

  listPublic(): Promise<Plan[]> {
    return this.planRepository.findPublic();
  }

  async getBySlug(slug: string): Promise<Plan> {
    const plan = await this.planRepository.findBySlug(slug);
    if (!plan) throw new RpcException('plan_not_found');
    return plan;
  }

  async getById(id: string): Promise<Plan> {
    const plan = await this.planRepository.findById(id);
    if (!plan) throw new RpcException('plan_not_found');
    return plan;
  }

  async create(input: CreatePlanDto, createdBy?: string): Promise<Plan> {
    const existing = await this.planRepository.findBySlug(input.slug);
    if (existing) throw new RpcException('plan_slug_taken');
    return this.planRepository.create({ ...input, createdBy } as any);
  }

  async update(id: string, changes: UpdatePlanDto): Promise<Plan> {
    const updated = await this.planRepository.update(id, changes as any);
    if (!updated) throw new RpcException('plan_not_found');
    return updated;
  }

  /** Soft delete: stops selling the plan, existing subscribers are untouched. */
  async archive(id: string): Promise<Plan> {
    const archived = await this.planRepository.archive(id);
    if (!archived) throw new RpcException('plan_not_found');
    return archived;
  }
}
