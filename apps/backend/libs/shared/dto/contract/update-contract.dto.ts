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
import {
  CONTRACT_TYPES,
  ContractTypeDto,
  CONTRACT_STATUSES,
  ContractStatusDto,
  PAYMENT_FREQUENCIES,
  PaymentFrequencyDto,
} from './create-contract.dto';

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  title?: string;

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
