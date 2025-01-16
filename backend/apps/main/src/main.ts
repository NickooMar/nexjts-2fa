import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  app.enableVersioning({ type: VersioningType.URI, prefix: 'api/v' });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors({ origin: '*' });

  await app.startAllMicroservices();
  await app.listen(port).then(() => {
    Logger.log(`Server running on ${port} 🚀`, 'Bootstrap');
  });
}
bootstrap();
