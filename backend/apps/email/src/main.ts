import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { EmailModule } from './email.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const host = process.env.EMAIL_SERVICE_HOST ?? 'localhost';
  const port = process.env.EMAIL_SERVICE_PORT
    ? parseInt(process.env.EMAIL_SERVICE_PORT, 10)
    : 3003;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    EmailModule,
    {
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    },
  );

  await app.listen().then(() => {
    Logger.log(`Email service is running 🚀`, 'Bootstrap');
  });
}

bootstrap();
