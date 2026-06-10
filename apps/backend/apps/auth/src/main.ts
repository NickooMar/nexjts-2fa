import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const host = process.env.AUTH_SERVICE_HOST ?? 'localhost';
  const port = process.env.AUTH_SERVICE_PORT
    ? parseInt(process.env.AUTH_SERVICE_PORT, 10)
    : 3001;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    },
  );

  await app.listen().then(() => {
    Logger.log(`Auth service is running 🚀`, 'Bootstrap');
  });
}

bootstrap();
