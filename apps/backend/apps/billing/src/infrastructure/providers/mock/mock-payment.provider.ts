import { createHmac, timingSafeEqual, randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProviders } from 'apps/constants';
import {
  PaymentProvider,
  ProviderChargeInput,
  ProviderChargeResult,
  ProviderCheckoutInput,
  ProviderCheckoutResult,
  NormalizedWebhookEvent,
} from '../../../domain/contracts/payment-provider.abstract';

/**
 * Development/default provider: settles every charge synchronously and
 * verifies webhooks with an HMAC shared secret. Lets the whole subscription
 * lifecycle (including past_due/suspension via simulated `payment_failed`
 * webhooks) run end-to-end without external credentials.
 */
@Injectable()
export class MockPaymentProvider extends PaymentProvider {
  readonly name = PaymentProviders.MOCK;

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async createCheckout(
    input: ProviderCheckoutInput,
  ): Promise<ProviderCheckoutResult> {
    return {
      outcome: 'succeeded',
      providerCustomerId: `mock_cus_${input.organizationId}`,
      providerSubscriptionId: `mock_sub_${randomUUID()}`,
      providerPaymentId: `mock_pay_${randomUUID()}`,
    };
  }

  async charge(_input: ProviderChargeInput): Promise<ProviderChargeResult> {
    return {
      outcome: 'succeeded',
      providerPaymentId: `mock_pay_${randomUUID()}`,
    };
  }

  async cancelRemote(): Promise<void> {
    // Nothing to cancel remotely for the mock provider.
  }

  /**
   * Payload: `{ type, organizationId, ... }` signed with
   * `x-billing-signature: hex(hmacSHA256(rawJson, BILLING_WEBHOOK_SECRET))`.
   */
  async verifyAndParseWebhook(
    payload: unknown,
    headers: Record<string, string>,
  ): Promise<NormalizedWebhookEvent> {
    const secret = this.configService.get<string>(
      'BILLING_WEBHOOK_SECRET',
      'dev-billing-webhook-secret',
    );
    const signature = headers['x-billing-signature'] ?? '';
    const expected = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const valid =
      signature.length === expected.length &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) {
      throw new Error('invalid_webhook_signature');
    }

    const event = payload as Record<string, any>;
    const known = [
      'payment_succeeded',
      'payment_failed',
      'subscription_cancelled',
    ];
    return {
      type: known.includes(event.type) ? event.type : 'unknown',
      organizationId: event.organizationId,
      providerPaymentId: event.providerPaymentId,
      amount: event.amount,
      currency: event.currency,
      failureReason: event.failureReason,
    };
  }
}
