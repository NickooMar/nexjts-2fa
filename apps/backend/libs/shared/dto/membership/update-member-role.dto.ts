import { IsIn, IsString, IsNotEmpty } from 'class-validator';
import { OrganizationRole, ORGANIZATION_ROLES } from 'apps/constants';

/**
 * Change another member's role. The tenant is taken from the caller's JWT on
 * the gateway, never from the client.
 */
export class UpdateMemberRoleDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsIn(ORGANIZATION_ROLES)
  role: OrganizationRole;
}
