import {
  IsIn,
  IsString,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { OrganizationRole, ORGANIZATION_ROLES } from 'apps/constants';

export class CreateMembershipDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsOptional()
  @IsIn(ORGANIZATION_ROLES)
  role?: OrganizationRole;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
