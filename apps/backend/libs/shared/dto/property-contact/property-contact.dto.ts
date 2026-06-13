import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

/**
 * Shared validation for a person attached to a property (renter or owner).
 * Concrete create/update DTOs for tenants and owners extend these.
 */
export class CreatePropertyContactDto {
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

export class UpdatePropertyContactDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  documentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
