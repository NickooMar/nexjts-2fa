import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class AppController {
  @Get('health')
  healthCheck(): string {
    return 'OK';
  }
}
