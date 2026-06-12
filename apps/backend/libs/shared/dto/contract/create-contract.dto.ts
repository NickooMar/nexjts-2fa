import {
  IsIn,
  Min,
  Length,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';

export const CONTRACT_TYPES = [
  'rental',
  'sale',
  'management',
  'other',
] as const;

export type ContractTypeDto = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_STATUSES = [
  'draft',
  'active',
  'expired',
  'terminated',
] as const;

export type ContractStatusDto = (typeof CONTRACT_STATUSES)[number];

export const PAYMENT_FREQUENCIES = [
  'monthly',
  'quarterly',
  'semiannual',
  'yearly',
  'one_time',
] as const;

export type PaymentFrequencyDto = (typeof PAYMENT_FREQUENCIES)[number];

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsIn(CONTRACT_TYPES)
  type?: ContractTypeDto;

  @IsOptional()
  @IsIn(CONTRACT_STATUSES)
  status?: ContractStatusDto;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  /** ISO 4217 code, e.g. USD / EUR / ARS. */
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsIn(PAYMENT_FREQUENCIES)
  paymentFrequency?: PaymentFrequencyDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deposit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
