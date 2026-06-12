import { BillingCycle, PaymentProviderName } from 'apps/constants';

export interface ProviderCheckoutInput {
  organizationId: string;
  planSlug: string;
  billingCycle: BillingCycle;
  /** Minor units (cents). */
  amount: number;
  currency: string;
}

export interface ProviderCheckoutResult {
  /**
   * `succeeded`  → provider settled synchronously (mock, saved card).
   * `pending`    → user must complete a hosted checkout (`checkoutUrl`).
   * `failed`     → charge declined.
   */
  outcome: 'succeeded' | 'pending' | 'failed';
  checkoutUrl?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  providerPaymentId?: string;
  failureReason?: string;
}

export interface ProviderChargeInput {
  organizationId: string;
  amount: number;
  currency: string;
  description: string;
  providerCustomerId?: string;
}

export interface ProviderChargeResult {
  outcome: 'succeeded' | 'failed';
  providerPaymentId?: string;
  failureReason?: string;
}

/** Provider-agnostic webhook event the billing domain understands. */
export interface NormalizedWebhookEvent {
  type:
    | 'payment_succeeded'
    | 'payment_failed'
    | 'subscription_cancelled'
    | 'unknown';
  organizationId?: string;
  providerPaymentId?: string;
  amount?: number;
  currency?: string;
  failureReason?: string;
}

/**
 * Payment provider port. The billing domain depends only on this contract;
 * Stripe, Mercado Pago, PayPal, … are adapters chosen by configuration
 * (BILLING_PAYMENT_PROVIDER) through the PaymentProviderFactory — mirroring
 * how the email service swaps Resend for other senders. Swapping providers
 * never touches subscription/invoice/usage logic.
 */
export abstract class PaymentProvider {
  abstract readonly name: PaymentProviderName;

  /** Start (or settle) a subscription purchase. */
  abstract createCheckout(
    input: ProviderCheckoutInput,
  ): Promise<ProviderCheckoutResult>;

  /** Charge a renewal/retry against the stored payment method. */
  abstract charge(input: ProviderChargeInput): Promise<ProviderChargeResult>;

  /** Cancel the provider-side subscription object, if any. */
  abstract cancelRemote(providerSubscriptionId?: string): Promise<void>;

  /**
   * Verify authenticity of a webhook (signature) and normalize it. Must throw
   * on invalid signatures — the gateway forwards these unauthenticated.
   */
  abstract verifyAndParseWebhook(
    payload: unknown,
    headers: Record<string, string>,
  ): Promise<NormalizedWebhookEvent>;
}
