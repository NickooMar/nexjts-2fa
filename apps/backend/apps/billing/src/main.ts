import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { BillingModule } from './billing.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const host = process.env.BILLING_SERVICE_HOST ?? 'localhost';
  const port = process.env.BILLING_SERVICE_PORT
    ? parseInt(process.env.BILLING_SERVICE_PORT, 10)
    : 3004;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    BillingModule,
    {
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    },
  );

  await app.listen().then(() => {
    Logger.log(`Billing service is running 🚀`, 'Bootstrap');
  });
}

bootstrap();
