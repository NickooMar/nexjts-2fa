import {
  Body,
  Post,
  Param,
  Headers,
  HttpCode,
  Controller,
  BadRequestException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { BillingProxy } from 'apps/billing/src/infrastructure/external/billing.proxy';

/**
 * Payment provider webhooks. Deliberately *not* behind JwtAuthGuard —
 * providers call this anonymously. The body and headers are forwarded
 * verbatim to the billing service, where the active provider adapter
 * verifies the signature before anything is trusted; an invalid signature
 * is rejected with 400 and never reaches domain logic.
 */
@Controller({ path: 'billing/webhooks', version: '1' })
export class BillingWebhookController {
  constructor(private readonly billingProxy: BillingProxy) {}

  @Post(':provider')
  @HttpCode(200)
  async handle(
    @Param('provider') provider: string,
    @Body() body: unknown,
    @Headers() headers: Record<string, string>,
  ) {
    try {
      await firstValueFrom(
        this.billingProxy.handleWebhook({ provider, body, headers }),
      );
      return { received: true };
    } catch (error: any) {
      if (String(error?.message).includes('invalid_webhook_signature')) {
        throw new BadRequestException('invalid_webhook_signature');
      }
      // Providers retry on 5xx — surface a 400 so poison payloads do not
      // retry forever, but keep the log trail in the billing service.
      throw new BadRequestException('webhook_rejected');
    }
  }
}
