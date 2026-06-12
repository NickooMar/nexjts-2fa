import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

/**
 * A property tenant (renter/occupant) living in the tenant database. Distinct
 * from the control-plane `Tenant` (organization) document.
 */
export class CreatePropertyTenantDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  fullName: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  /** National identity / passport number — free-form. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  documentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
