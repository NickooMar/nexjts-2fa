import { from, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { OrganizationRole } from 'apps/constants';
import { Invitation } from '../entities/invitation.entity';
import { Membership } from '../entities/membership.entity';
import { InvitationRepository } from '../../infrastructure/repository/invitation.repository';
import { MembershipRepository } from '../../infrastructure/repository/membership.repository';
import { TenantRepository } from '../../infrastructure/repository/tenant.repository';

@Injectable()
export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly tenantRepository: TenantRepository,
  ) {}

  create(payload: {
    tenantId: string;
    role?: OrganizationRole;
    createdBy?: string;
  }): Observable<Invitation> {
    return from(
      this.invitationRepository.createForTenant(
        payload.tenantId,
        payload.role,
        payload.createdBy,
      ),
    );
  }

  /**
   * Redeem an invitation code: validates the invitation, guards against
   * duplicate membership, creates the membership, and marks the invitation
   * accepted. Returns the new membership plus the joined tenant for display.
   */
  accept(payload: {
    code: string;
    userId: string;
  }): Observable<{ membership: Membership; tenant: any }> {
    return from(this.redeem(payload.code, payload.userId));
  }

  private async redeem(code: string, userId: string) {
    const invitation = await this.invitationRepository.findByCode(code);
    if (!invitation || invitation.status === 'revoked') {
      throw new RpcException('invalid_invitation');
    }
    if (invitation.status === 'accepted') {
      throw new RpcException('invitation_already_used');
    }
    if (new Date(invitation.expiresAt) < new Date()) {
      await this.invitationRepository.setStatus(invitation._id, 'expired');
      throw new RpcException('invitation_expired');
    }

    const tenantId = String(invitation.tenantId);

    const existing = await this.membershipRepository.findByUserAndTenant(
      userId,
      tenantId,
    );
    if (existing) {
      throw new RpcException('already_a_member');
    }

    // First org for this user becomes their login default.
    const hasPrimary =
      await this.membershipRepository.findPrimaryForUser(userId);

    const membership = await this.membershipRepository.create({
      userId,
      tenantId,
      role: invitation.role,
      isPrimary: !hasPrimary,
    });

    await this.invitationRepository.setStatus(
      invitation._id,
      'accepted',
      userId,
    );

    const tenant = await this.tenantRepository.findById(tenantId);

    return { membership, tenant };
  }
}
