import { IsIn, IsOptional } from 'class-validator';
import { OrganizationRole, ORGANIZATION_ROLES } from 'apps/constants';

/**
 * Generate an invitation code for the caller's current organization. The
 * tenant and inviter come from the JWT on the gateway, never from the client.
 */
export class CreateInvitationDto {
  @IsOptional()
  @IsIn(ORGANIZATION_ROLES)
  role?: OrganizationRole;
}
