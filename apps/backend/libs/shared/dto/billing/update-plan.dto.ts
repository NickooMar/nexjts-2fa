import {
  Min,
  IsInt,
  IsString,
  IsObject,
  MaxLength,
  MinLength,
  IsBoolean,
  IsOptional,
} from 'class-validator';

/** Partial plan update; the slug is immutable once created. */
export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  prices?: Record<string, { amount: number; currency: string }>;

  @IsOptional()
  @IsObject()
  limits?: Record<string, number>;

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
