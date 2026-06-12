import {
  Get,
  Body,
  Post,
  Patch,
  UseGuards,
  Controller,
  HttpException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  Observable,
  catchError,
  firstValueFrom,
  from,
  map,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import {
  BillingEventPatterns,
  ROLES_THAT_MANAGE_MEMBERS,
} from 'apps/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanEnforcementService } from '../billing/plan-enforcement.service';
import { BillingProxy } from 'apps/billing/src/infrastructure/external/billing.proxy';
import { LoginProtectionService } from '../security/login-protection.service';
import {
  InvitationThrottle,
  JoinOrganizationThrottle,
  SwitchOrganizationThrottle,
  CreateOrganizationThrottle,
} from '../security/throttle-policies';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';
import { MembershipProxy } from 'apps/user/src/infrastructure/external/membership.proxy';
import { InvitationProxy } from 'apps/user/src/infrastructure/external/invitation.proxy';
import { SwitchTenantRequestDto } from 'libs/shared/dto/auth/switch-tenant.dto';
import { UpdateMemberRoleDto } from 'libs/shared/dto/membership/update-member-role.dto';
import { CreateInvitationDto } from 'libs/shared/dto/invitation/create-invitation.dto';
import { AcceptInvitationDto } from 'libs/shared/dto/invitation/accept-invitation.dto';
import { CreateOrganizationDto } from 'libs/shared/dto/organization/create-organization.dto';

interface AuthUser {
  _id: string;
  role: string;
  tenantId: string;
}

/** Errors the user can act on (bad code, expired invite, duplicate join…). */
const CLIENT_ERRORS = [
  'not_a_member',
  'already_a_member',
  'invalid_invitation',
  'invitation_expired',
  'invitation_already_used',
];

@Controller({ path: 'organizations', version: '1' })
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(
    private readonly membershipProxy: MembershipProxy,
    private readonly invitationProxy: InvitationProxy,
    private readonly authProxy: AuthProxy,
    private readonly billingProxy: BillingProxy,
    private readonly loginProtection: LoginProtectionService,
    private readonly planEnforcement: PlanEnforcementService,
  ) {}

  /** Plan enforcement: target org must have a free member seat. */
  private async assertMemberSeatAvailable(tenantId: string): Promise<void> {
    const current = await firstValueFrom(
      this.membershipProxy.countByTenant(tenantId),
    );
    await this.planEnforcement.assertCanAddMember(tenantId, current);
  }

  /** Organizations the current user belongs to (for the org switcher). */
  @Get()
  listMyOrganizations(@CurrentUser() user: AuthUser): Observable<any> {
    return this.membershipProxy.listOrganizations(user._id).pipe(
      map((organizations) => ({ success: true, organizations })),
      catchError((error) => {
        throw new InternalServerErrorException(
          error?.message || 'Failed to list organizations',
        );
      }),
    );
  }

  /**
   * Create a new organization for the current user (owner membership +
   * re-issued tokens scoped to the new org).
   */
  @Post()
  @CreateOrganizationThrottle()
  createOrganization(
    @CurrentUser() user: AuthUser,
    @Body() input: CreateOrganizationDto,
  ): Observable<any> {
    return this.authProxy
      .createOrganization(
        user._id,
        input.name,
        input.website,
        input.phone,
        input.country,
      )
      .pipe(
        tap((result) => {
          // Bootstrap billing for the new org (default plan + usage seed).
          const organizationId = result?.tenant?._id;
          if (organizationId) {
            this.billingProxy.emitUsageEvent(
              BillingEventPatterns.ORGANIZATION_CREATED,
              { organizationId: String(organizationId) },
            );
          }
        }),
        catchError((error) => {
          throw new InternalServerErrorException(
            error?.message || 'Failed to create organization',
          );
        }),
      );
  }

  /** Generate an invitation code for the caller's current org (owner/admin). */
  @Post('invitations')
  @InvitationThrottle()
  createInvitation(
    @CurrentUser() user: AuthUser,
    @Body() input: CreateInvitationDto,
  ): Observable<any> {
    if (!user.tenantId) {
      return throwError(
        () => new BadRequestException('missing_tenant_context'),
      );
    }
    if (!ROLES_THAT_MANAGE_MEMBERS.includes(user.role as never)) {
      return throwError(
        () => new ForbiddenException('insufficient_permissions'),
      );
    }

    // Reject invitations once the plan's member limit is reached — there is
    // no seat for the invitee to take.
    return from(this.assertMemberSeatAvailable(user.tenantId)).pipe(
      switchMap(() =>
        this.invitationProxy.create({
          tenantId: user.tenantId,
          role: input.role,
          createdBy: user._id,
        }),
      ),
      map((invitation) => ({
        success: true,
        invitation: {
          code: invitation.code,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
      })),
      catchError((error) => {
        if (error instanceof HttpException) throw error;
        throw new InternalServerErrorException(
          error?.message || 'Failed to create invitation',
        );
      }),
    );
  }

  /**
   * Redeem an invitation code: creates the membership, then re-issues tokens
   * scoped to the joined org so the session lands inside it.
   */
  @Post('join')
  @JoinOrganizationThrottle()
  joinOrganization(
    @CurrentUser() user: AuthUser,
    @Body() input: AcceptInvitationDto,
  ): Observable<any> {
    // Invitation codes are bearer credentials: lock out users who keep
    // guessing invalid/expired codes.
    return from(
      this.loginProtection.assertNotLocked('invite-join', user._id),
    ).pipe(
      // Resolve the target org from the code (read-only) so the plan's
      // member limit is enforced *before* the membership is created.
      switchMap(() => this.invitationProxy.peek(input.code)),
      switchMap((invitation) =>
        from(
          this.assertMemberSeatAvailable(String(invitation.tenantId)),
        ),
      ),
      switchMap(() =>
        this.invitationProxy.accept({ code: input.code, userId: user._id }),
      ),
      tap(({ membership }) => {
        void this.loginProtection.recordSuccess('invite-join', user._id);
        this.billingProxy.emitUsageEvent(BillingEventPatterns.MEMBER_ADDED, {
          organizationId: String(membership.tenantId),
        });
      }),
      switchMap(({ membership, tenant }) =>
        this.authProxy.switchTenant(user._id, String(membership.tenantId)).pipe(
          map((result) => ({
            success: true,
            tenant: tenant
              ? { _id: tenant._id, name: tenant.name, slug: tenant.slug }
              : null,
            tokens: result.tokens,
          })),
        ),
      ),
      catchError((error) => {
        if (error instanceof HttpException && error.getStatus() === 402) {
          // Plan limit of the target org — not a guessing attempt.
          throw error;
        }
        const message = error?.message || 'Failed to join organization';
        const known = CLIENT_ERRORS.find((code) => message.includes(code));
        if (known) {
          if (known !== 'already_a_member') {
            void this.loginProtection.recordFailure('invite-join', user._id);
          }
          throw new BadRequestException(known);
        }
        if (error?.response?.code === 'temporarily_locked') {
          throw error;
        }
        throw new InternalServerErrorException(message);
      }),
    );
  }

  /** Re-issue tokens scoped to another organization the user belongs to. */
  @Post('switch')
  @SwitchOrganizationThrottle()
  switchOrganization(
    @CurrentUser() user: AuthUser,
    @Body() input: SwitchTenantRequestDto,
  ): Observable<any> {
    return this.authProxy.switchTenant(user._id, input.tenantId).pipe(
      catchError((error) => {
        const message = error?.message || 'Failed to switch organization';
        if (message.includes('not_a_member')) {
          throw new ForbiddenException('not_a_member');
        }
        throw new InternalServerErrorException(message);
      }),
    );
  }

  /** Members of the caller's current organization. */
  @Get('members')
  listMembers(@CurrentUser() user: AuthUser): Observable<any> {
    if (!user.tenantId) {
      return throwError(
        () => new BadRequestException('missing_tenant_context'),
      );
    }
    return this.membershipProxy.listMembers(user.tenantId).pipe(
      map((members) => ({ success: true, members })),
      catchError((error) => {
        throw new InternalServerErrorException(
          error?.message || 'Failed to list members',
        );
      }),
    );
  }

  /** Change another member's role (owner/admin only). */
  @Patch('members/role')
  updateMemberRole(
    @CurrentUser() user: AuthUser,
    @Body() input: UpdateMemberRoleDto,
  ): Observable<any> {
    if (!user.tenantId) {
      return throwError(
        () => new BadRequestException('missing_tenant_context'),
      );
    }
    if (!ROLES_THAT_MANAGE_MEMBERS.includes(user.role as never)) {
      return throwError(
        () => new ForbiddenException('insufficient_permissions'),
      );
    }

    if (input.userId === user._id) {
      return throwError(
        () => new BadRequestException('cannot_change_own_role'),
      );
    }

    return this.membershipProxy
      .updateRole(input.userId, user.tenantId, input.role)
      .pipe(
        map((membership) => {
          if (!membership) {
            throw new BadRequestException('member_not_found');
          }
          return { success: true, membership };
        }),
        catchError((error) => {
          if (
            error instanceof ForbiddenException ||
            error instanceof BadRequestException
          ) {
            throw error;
          }
          throw new InternalServerErrorException(
            error?.message || 'Failed to update member role',
          );
        }),
      );
  }
}
