import {
  Get,
  Body,
  Post,
  Patch,
  UseGuards,
  Controller,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { ROLES_THAT_MANAGE_MEMBERS } from 'apps/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  ) {}

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
        catchError((error) => {
          throw new InternalServerErrorException(
            error?.message || 'Failed to create organization',
          );
        }),
      );
  }

  /** Generate an invitation code for the caller's current org (owner/admin). */
  @Post('invitations')
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

    return this.invitationProxy
      .create({
        tenantId: user.tenantId,
        role: input.role,
        createdBy: user._id,
      })
      .pipe(
        map((invitation) => ({
          success: true,
          invitation: {
            code: invitation.code,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
          },
        })),
        catchError((error) => {
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
  joinOrganization(
    @CurrentUser() user: AuthUser,
    @Body() input: AcceptInvitationDto,
  ): Observable<any> {
    return this.invitationProxy
      .accept({ code: input.code, userId: user._id })
      .pipe(
        switchMap(({ membership, tenant }) =>
          this.authProxy
            .switchTenant(user._id, String(membership.tenantId))
            .pipe(
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
          const message = error?.message || 'Failed to join organization';
          const known = CLIENT_ERRORS.find((code) => message.includes(code));
          if (known) {
            throw new BadRequestException(known);
          }
          throw new InternalServerErrorException(message);
        }),
      );
  }

  /** Re-issue tokens scoped to another organization the user belongs to. */
  @Post('switch')
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
