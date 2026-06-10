import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { Clients, OrganizationRole, MembershipPatterns } from 'apps/constants';
import {
  Membership,
  UserMember,
  UserOrganization,
} from '../../domain/entities/membership.entity';
import { CreateMembershipDto } from 'libs/shared/dto/membership/create-membership.dto';

@Injectable()
export class MembershipProxy {
  constructor(
    @Inject(Clients.USER_CLIENT)
    private readonly userClient: ClientProxy,
  ) {}

  create(input: CreateMembershipDto): Observable<Membership> {
    return this.userClient
      .send<Membership>({ cmd: MembershipPatterns.CREATE }, input)
      .pipe(
        catchError((error) => {
          if (error instanceof RpcException) {
            return throwError(() => error);
          }
          return throwError(() => new RpcException(error.message));
        }),
      );
  }

  listOrganizations(userId: string): Observable<UserOrganization[]> {
    return this.userClient.send<UserOrganization[]>(
      { cmd: MembershipPatterns.LIST_ORGS },
      userId,
    );
  }

  listMembers(tenantId: string): Observable<UserMember[]> {
    return this.userClient.send<UserMember[]>(
      { cmd: MembershipPatterns.LIST_MEMBERS },
      tenantId,
    );
  }

  updateRole(
    userId: string,
    tenantId: string,
    role: OrganizationRole,
  ): Observable<Membership | null> {
    return this.userClient
      .send<Membership | null>(
        { cmd: MembershipPatterns.UPDATE_ROLE },
        { userId, tenantId, role },
      )
      .pipe(
        catchError((error) => {
          if (error instanceof RpcException) {
            return throwError(() => error);
          }
          return throwError(() => new RpcException(error.message));
        }),
      );
  }

  findPrimaryForUser(userId: string): Observable<Membership | null> {
    return this.userClient.send<Membership | null>(
      { cmd: MembershipPatterns.FIND_PRIMARY_FOR_USER },
      userId,
    );
  }

  findByUserAndTenant(
    userId: string,
    tenantId: string,
  ): Observable<Membership | null> {
    return this.userClient.send<Membership | null>(
      { cmd: MembershipPatterns.FIND_BY_USER_AND_TENANT },
      { userId, tenantId },
    );
  }
}
