import {
  Min,
  IsInt,
  IsString,
  IsObject,
  MaxLength,
  MinLength,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

/**
 * Plans are configured through the API/DB — limits and features are open
 * maps validated only for shape, so new keys never require a schema change.
 */
export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /** `{ monthly: { amount, currency }, yearly: { amount, currency } }`. */
  @IsObject()
  prices: Record<string, { amount: number; currency: string }>;

  /** `{ properties: 5, storageGb: 1, … }`; -1 = unlimited. */
  @IsObject()
  limits: Record<string, number>;

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;

  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
