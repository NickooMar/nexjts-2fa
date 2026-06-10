import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { OrganizationRole, MembershipPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import {
  Membership,
  UserMember,
  UserOrganization,
} from '../../domain/entities/membership.entity';
import { MembershipService } from '../../domain/services/membership.service';
import { CreateMembershipDto } from 'libs/shared/dto/membership/create-membership.dto';

@Controller()
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @MessagePattern({ cmd: MembershipPatterns.CREATE })
  create(input: CreateMembershipDto): Observable<Membership> {
    return this.membershipService.create(input);
  }

  @MessagePattern({ cmd: MembershipPatterns.UPDATE_ROLE })
  updateRole(payload: {
    userId: string;
    tenantId: string;
    role: OrganizationRole;
  }): Observable<Membership | null> {
    return this.membershipService.updateRole(payload);
  }

  @MessagePattern({ cmd: MembershipPatterns.LIST_ORGS })
  listOrganizations(userId: string): Observable<UserOrganization[]> {
    return this.membershipService.listOrganizations(userId);
  }

  @MessagePattern({ cmd: MembershipPatterns.LIST_MEMBERS })
  listMembers(tenantId: string): Observable<UserMember[]> {
    return this.membershipService.listMembers(tenantId);
  }

  @MessagePattern({ cmd: MembershipPatterns.FIND_BY_USER })
  findByUser(userId: string): Observable<Membership[]> {
    return this.membershipService.findByUser(userId);
  }

  @MessagePattern({ cmd: MembershipPatterns.FIND_PRIMARY_FOR_USER })
  findPrimaryForUser(userId: string): Observable<Membership | null> {
    return this.membershipService.findPrimaryForUser(userId);
  }

  @MessagePattern({ cmd: MembershipPatterns.FIND_BY_USER_AND_TENANT })
  findByUserAndTenant(payload: {
    userId: string;
    tenantId: string;
  }): Observable<Membership | null> {
    return this.membershipService.findByUserAndTenant(payload);
  }
}
