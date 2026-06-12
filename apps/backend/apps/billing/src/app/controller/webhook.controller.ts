import { Observable, from } from 'rxjs';
import { Controller, Logger } from '@nestjs/common';
import { RpcException, MessagePattern } from '@nestjs/microservices';
import { BillingPatterns } from 'apps/constants';
import { SubscriptionService } from '../../domain/services/subscription.service';
import { PaymentProviderFactory } from '../../infrastructure/providers/payment-provider.factory';

/**
 * Provider webhooks, forwarded raw by the gateway (they arrive
 * unauthenticated — signature verification inside the provider adapter is
 * the only trust boundary). The provider normalizes the payload into a
 * domain event before the subscription service ever sees it.
 */
@Controller()
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly providerFactory: PaymentProviderFactory,
  ) {}

  @MessagePattern({ cmd: BillingPatterns.HANDLE_WEBHOOK })
  handleWebhook(payload: {
    provider?: string;
    body: unknown;
    headers: Record<string, string>;
  }): Observable<{ received: boolean }> {
    return from(this.process(payload));
  }

  private async process(payload: {
    body: unknown;
    headers: Record<string, string>;
  }): Promise<{ received: boolean }> {
    const provider = this.providerFactory.getProvider();
    let event;
    try {
      event = await provider.verifyAndParseWebhook(
        payload.body,
        payload.headers ?? {},
      );
    } catch (error) {
      this.logger.warn(`Rejected webhook: ${error}`);
      throw new RpcException('invalid_webhook_signature');
    }

    await this.subscriptionService.applyWebhookEvent(event);
    return { received: true };
  }
}
