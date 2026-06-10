import { from, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { OrganizationRole } from 'apps/constants';
import {
  Membership,
  UserMember,
  UserOrganization,
} from '../entities/membership.entity';
import { CreateMembershipDto } from 'libs/shared/dto/membership/create-membership.dto';
import { MembershipRepository } from '../../infrastructure/repository/membership.repository';
import { TenantRepository } from '../../infrastructure/repository/tenant.repository';
import { UserRepository } from '../../infrastructure/repository/user.repository';
import { User } from '../entities/user.entity';

@Injectable()
export class MembershipService {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository<User>,
  ) {}

  create(input: CreateMembershipDto): Observable<Membership> {
    return from(this.membershipRepository.create(input));
  }

  updateRole(payload: {
    userId: string;
    tenantId: string;
    role: OrganizationRole;
  }): Observable<Membership | null> {
    return from(
      this.membershipRepository.updateRole(
        payload.userId,
        payload.tenantId,
        payload.role,
      ),
    );
  }

  /** Members of a tenant enriched with user fields, for the members list. */
  listMembers(tenantId: string): Observable<UserMember[]> {
    return from(this.resolveMembers(tenantId));
  }

  findByUser(userId: string): Observable<Membership[]> {
    return from(this.membershipRepository.findByUser(userId));
  }

  findPrimaryForUser(userId: string): Observable<Membership | null> {
    return from(this.membershipRepository.findPrimaryForUser(userId));
  }

  findByUserAndTenant(payload: {
    userId: string;
    tenantId: string;
  }): Observable<Membership | null> {
    return from(
      this.membershipRepository.findByUserAndTenant(
        payload.userId,
        payload.tenantId,
      ),
    );
  }

  /** Memberships enriched with tenant display fields, for the org switcher. */
  listOrganizations(userId: string): Observable<UserOrganization[]> {
    return from(this.resolveOrganizations(userId));
  }

  private async resolveOrganizations(
    userId: string,
  ): Promise<UserOrganization[]> {
    const memberships = await this.membershipRepository.findByUser(userId);

    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        const tenant = await this.tenantRepository.findById(
          String(membership.tenantId),
        );
        if (!tenant) return null;
        return {
          tenantId: String(membership.tenantId),
          name: tenant.name,
          slug: tenant.slug,
          role: membership.role,
          isPrimary: membership.isPrimary,
        } as UserOrganization;
      }),
    );

    return organizations.filter((org): org is UserOrganization => org !== null);
  }

  private async resolveMembers(tenantId: string): Promise<UserMember[]> {
    const memberships = await this.membershipRepository.findByTenant(tenantId);

    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await this.userRepository.findById(
          String(membership.userId),
        );
        if (!user) return null;
        return {
          userId: String(membership.userId),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: membership.role,
          status: membership.status,
          isPrimary: membership.isPrimary,
        } as UserMember;
      }),
    );

    return members.filter((member): member is UserMember => member !== null);
  }
}
