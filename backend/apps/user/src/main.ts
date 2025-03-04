import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const host = process.env.USER_SERVICE_HOST ?? 'localhost';
  const port = process.env.USER_SERVICE_PORT
    ? parseInt(process.env.USER_SERVICE_PORT, 10)
    : 3002;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen().then(() => {
    Logger.log(`User service is running 🚀`, 'Bootstrap');
  });
}

bootstrap();
