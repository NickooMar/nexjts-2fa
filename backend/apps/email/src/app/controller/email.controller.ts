import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { EmailPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { EmailService } from '../../domain/services/email.service';

@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @MessagePattern({ cmd: EmailPatterns.SEND_VERIFICATION_EMAIL })
  sendVerificationEmail(input: any): Observable<any> {
    return this.emailService.sendVerificationEmail(input);
  }
}
