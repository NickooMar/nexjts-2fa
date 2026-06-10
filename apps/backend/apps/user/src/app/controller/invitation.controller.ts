import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { OrganizationRole, InvitationPatterns } from 'apps/constants';
import { Invitation } from '../../domain/entities/invitation.entity';
import { InvitationService } from '../../domain/services/invitation.service';

@Controller()
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @MessagePattern({ cmd: InvitationPatterns.CREATE })
  create(payload: {
    tenantId: string;
    role?: OrganizationRole;
    createdBy?: string;
  }): Observable<Invitation> {
    return this.invitationService.create(payload);
  }

  @MessagePattern({ cmd: InvitationPatterns.ACCEPT })
  accept(payload: { code: string; userId: string }): Observable<any> {
    return this.invitationService.accept(payload);
  }
}
