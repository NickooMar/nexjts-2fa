import { Clients } from 'apps/constants';
import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { PassportModule } from '@nestjs/passport';
import { validationSchema } from 'apps/env.validation';
import { AuthController } from './auth/auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SecurityModule } from './security/security.module';
import { StorageModule } from 'libs/storage/storage.module';
import { MediaProxy } from './media/media.proxy';
import { MediaUrlService } from './media/media-url.service';
import { PropertyMediaController } from './media/property-media.controller';
import { OrganizationBrandingController } from './media/organization-branding.controller';
import { PropertyProxy } from './properties/property.proxy';
import { ContractProxy } from './contracts/contract.proxy';
import { ContractsController } from './contracts/contracts.controller';
import { PropertyTenantProxy } from './tenants/property-tenant.proxy';
import {
  TenantsController,
  PropertyTenantsController,
} from './tenants/tenants.controller';
import { PropertyOwnerProxy } from './owners/property-owner.proxy';
import {
  OwnersController,
  PropertyOwnersController,
} from './owners/owners.controller';
import { BillingController } from './billing/billing.controller';
import { BillingWebhookController } from './billing/billing-webhook.controller';
import { PlanEnforcementService } from './billing/plan-enforcement.service';
import { ApiUsageInterceptor } from './billing/api-usage.interceptor';
import { BillingProxy } from 'apps/billing/src/infrastructure/external/billing.proxy';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';
import { UserProxy } from 'apps/user/src/infrastructure/external/user.proxy';
import { PropertiesController } from './properties/properties.controller';
import { OrganizationsController } from './organizations/organizations.controller';
import { MembershipProxy } from 'apps/user/src/infrastructure/external/membership.proxy';
import { InvitationProxy } from 'apps/user/src/infrastructure/external/invitation.proxy';
import { JwtStrategy } from 'apps/auth/src/infrastructure/strategies/jwt.strategy';
import { LocationsService } from './locations/locations.service';
import { LocationsController } from './locations/locations.controller';

@Global()
@Module({
  imports: [
    PassportModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      envFilePath: '.env',
    }),
    SecurityModule,
    StorageModule,
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: Clients.AUTH_CLIENT,
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTH_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('AUTH_SERVICE_PORT', 3001),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: Clients.USER_CLIENT,
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('USER_SERVICE_HOST', 'localhost'),
            port: configService.get<number>('USER_SERVICE_PORT', 3002),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: Clients.BILLING_CLIENT,
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>(
              'BILLING_SERVICE_HOST',
              'localhost',
            ),
            port: configService.get<number>('BILLING_SERVICE_PORT', 3004),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [
    AppController,
    AuthController,
    BillingController,
    BillingWebhookController,
    TenantsController,
    ContractsController,
    PropertiesController,
    PropertyMediaController,
    PropertyTenantsController,
    OwnersController,
    PropertyOwnersController,
    OrganizationsController,
    OrganizationBrandingController,
    LocationsController,
  ],
  providers: [
    AuthProxy,
    JwtStrategy,
    UserProxy,
    MediaProxy,
    MediaUrlService,
    PropertyProxy,
    ContractProxy,
    BillingProxy,
    MembershipProxy,
    InvitationProxy,
    PropertyTenantProxy,
    PropertyOwnerProxy,
    PlanEnforcementService,
    LocationsService,
    // Meters apiRequestsPerMonth per organization (batched, zero latency).
    { provide: APP_INTERCEPTOR, useClass: ApiUsageInterceptor },
  ],
})
export class AppModule {}
