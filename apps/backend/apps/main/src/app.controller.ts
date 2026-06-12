import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('api')
export class AppController {
  // Load balancer health checks are exempt from rate limiting.
  @Get('health')
  @SkipThrottle()
  healthCheck(): string {
    return 'OK';
  }
}
