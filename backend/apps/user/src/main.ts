import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpToRpcExceptionFilter } from 'libs/shared/exceptions/http-to-rpc.exception';
import { LoggingInterceptor } from 'libs/shared/interceptors/logging.interceptor';

async function bootstrap() {
  const host = process.env.USER_SERVICE_HOST ?? 'localhost';
  const port = process.env.USER_SERVICE_PORT
    ? parseInt(process.env.USER_SERVICE_PORT, 10)
    : 3002;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      options: {
        debug: true,
        host,
        port,
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new HttpToRpcExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen().then(() => {
    Logger.log(`User service is running 🚀`, 'Bootstrap');
  });
}

bootstrap();
