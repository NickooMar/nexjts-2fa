import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpExceptionFilter } from 'libs/shared/exceptions/http-to-rpc.exception.filter';
import { NotFoundExceptionFilter } from 'libs/shared/exceptions/not-found.exception.filter';
import { RpcToHttpExceptionFilter } from 'libs/shared/exceptions/rpc-to-http.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  app.enableCors({ origin: '*' });
  app.useGlobalPipes(new ValidationPipe());
  app.enableVersioning({ type: VersioningType.URI, prefix: 'api/v' });
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new NotFoundExceptionFilter(),
    new RpcToHttpExceptionFilter(),
  );

  await app.startAllMicroservices();
  await app.listen(port).then(() => {
    Logger.log(`Server running on ${port} 🚀`, 'Bootstrap');
  });
}
bootstrap();
