import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { validationSchema } from 'apps/env.validation';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlanSchema } from './infrastructure/schemas/plan.schema';
import { InvoiceSchema } from './infrastructure/schemas/invoice.schema';
import { PaymentSchema } from './infrastructure/schemas/payment.schema';
import { FeatureFlagSchema } from './infrastructure/schemas/feature-flag.schema';
import { SubscriptionSchema } from './infrastructure/schemas/subscription.schema';
import { ProcessedEventSchema } from './infrastructure/schemas/processed-event.schema';
import { SubscriptionUsageSchema } from './infrastructure/schemas/subscription-usage.schema';
import { PlanController } from './app/controller/plan.controller';
import { UsageController } from './app/controller/usage.controller';
import { InvoiceController } from './app/controller/invoice.controller';
import { WebhookController } from './app/controller/webhook.controller';
import { UsageEventsController } from './app/controller/usage-events.controller';
import { SubscriptionController } from './app/controller/subscription.controller';
import { PlanService } from './domain/services/plan.service';
import { UsageService } from './domain/services/usage.service';
import { InvoiceService } from './domain/services/invoice.service';
import { EntitlementService } from './domain/services/entitlement.service';
import { SubscriptionService } from './domain/services/subscription.service';
import { PlanSeedService } from './infrastructure/seed/plan-seed.service';
import { PlanRepository } from './infrastructure/repository/plan.repository';
import { InvoiceRepository } from './infrastructure/repository/invoice.repository';
import { PaymentRepository } from './infrastructure/repository/payment.repository';
import { FeatureFlagRepository } from './infrastructure/repository/feature-flag.repository';
import { SubscriptionRepository } from './infrastructure/repository/subscription.repository';
import { ProcessedEventRepository } from './infrastructure/repository/processed-event.repository';
import { SubscriptionUsageRepository } from './infrastructure/repository/subscription-usage.repository';
import { MockPaymentProvider } from './infrastructure/providers/mock/mock-payment.provider';
import { PaymentProviderFactory } from './infrastructure/providers/payment-provider.factory';

/**
 * Billing microservice: plans, subscriptions, usage metering, invoices,
 * payments and entitlements — all organization-scoped. Billing data lives in
 * the shared control-plane database (like users/tenants/memberships), since
 * it spans tenants rather than belonging to any tenant's data plane.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGO_URI',
          'mongodb://localhost:27017/property-manager',
        ),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: 'Plan', schema: PlanSchema },
      { name: 'Invoice', schema: InvoiceSchema },
      { name: 'Payment', schema: PaymentSchema },
      { name: 'FeatureFlag', schema: FeatureFlagSchema },
      { name: 'Subscription', schema: SubscriptionSchema },
      { name: 'ProcessedEvent', schema: ProcessedEventSchema },
      { name: 'SubscriptionUsage', schema: SubscriptionUsageSchema },
    ]),
  ],
  controllers: [
    PlanController,
    UsageController,
    InvoiceController,
    WebhookController,
    UsageEventsController,
    SubscriptionController,
  ],
  providers: [
    PlanService,
    PlanRepository,
    UsageService,
    InvoiceService,
    InvoiceRepository,
    PaymentRepository,
    PlanSeedService,
    EntitlementService,
    FeatureFlagRepository,
    SubscriptionService,
    SubscriptionRepository,
    ProcessedEventRepository,
    SubscriptionUsageRepository,
    MockPaymentProvider,
    PaymentProviderFactory,
  ],
})
export class BillingModule {}
