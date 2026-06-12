import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { parseTrustProxy } from './security/client-ip.util';
import { HttpExceptionFilter } from 'libs/shared/exceptions/http-to-rpc.exception.filter';
import { NotFoundExceptionFilter } from 'libs/shared/exceptions/not-found.exception.filter';
import { RpcToHttpExceptionFilter } from 'libs/shared/exceptions/rpc-to-http.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Resolve real client IPs from X-Forwarded-For behind the ALB/nginx
  // (TRUST_PROXY = number of proxy hops in front of this service).
  app.set(
    'trust proxy',
    parseTrustProxy(configService.get<string>('TRUST_PROXY')),
  );

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
