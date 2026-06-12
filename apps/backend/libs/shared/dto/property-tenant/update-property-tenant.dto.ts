import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class UpdatePropertyTenantDto {
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
