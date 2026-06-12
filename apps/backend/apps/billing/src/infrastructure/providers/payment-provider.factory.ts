import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProviders } from 'apps/constants';
import { PaymentProvider } from '../../domain/contracts/payment-provider.abstract';
import { MockPaymentProvider } from './mock/mock-payment.provider';

/**
 * Resolves the active payment provider from configuration — same strategy
 * pattern as the email service's provider factory. Adding Stripe or Mercado
 * Pago means implementing PaymentProvider and registering it here; the
 * billing domain stays untouched.
 */
@Injectable()
export class PaymentProviderFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly mockProvider: MockPaymentProvider,
  ) {}

  getProvider(): PaymentProvider {
    const provider = this.configService.get<string>(
      'BILLING_PAYMENT_PROVIDER',
      PaymentProviders.MOCK,
    );

    switch (provider) {
      case PaymentProviders.MOCK:
        return this.mockProvider;
      // case PaymentProviders.STRIPE: return this.stripeProvider;
      // case PaymentProviders.MERCADO_PAGO: return this.mercadoPagoProvider;
      default:
        throw new Error(`payment_provider_not_configured: ${provider}`);
    }
  }
}
