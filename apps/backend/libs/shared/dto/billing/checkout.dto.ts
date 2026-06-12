import { IsIn, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { BillingCycle, BillingCycles } from 'apps/constants';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  planSlug: string;

  @IsIn(Object.values(BillingCycles))
  billingCycle: BillingCycle;
}

/** Plan changes carry the same shape as a checkout. */
export class ChangePlanDto extends CheckoutDto {}
