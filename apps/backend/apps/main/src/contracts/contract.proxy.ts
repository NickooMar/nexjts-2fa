import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Clients, ContractPatterns } from 'apps/constants';
import { CreateContractDto } from 'libs/shared/dto/contract/create-contract.dto';
import { UpdateContractDto } from 'libs/shared/dto/contract/update-contract.dto';

/**
 * Gateway-side proxy to the tenant-scoped Contract handlers in the user
 * service. The tenant `dbName` is always supplied by the gateway from the
 * JWT, never the client.
 */
@Injectable()
export class ContractProxy {
  constructor(
    @Inject(Clients.USER_CLIENT)
    private readonly userClient: ClientProxy,
  ) {}

  private forwardRpcError<T>() {
    return catchError<T, Observable<never>>((error) => {
      if (error instanceof RpcException) {
        return throwError(() => error);
      }
      return throwError(() => new RpcException(error.message));
    });
  }

  create(
    dbName: string,
    propertyId: string,
    data: CreateContractDto,
    createdBy?: string,
  ): Observable<any> {
    return this.userClient
      .send(
        { cmd: ContractPatterns.CREATE },
        { dbName, propertyId, data, createdBy },
      )
      .pipe(this.forwardRpcError());
  }

  findByProperty(dbName: string, propertyId: string): Observable<any> {
    return this.userClient
      .send({ cmd: ContractPatterns.FIND_BY_PROPERTY }, { dbName, propertyId })
      .pipe(this.forwardRpcError());
  }

  findOne(dbName: string, id: string): Observable<any> {
    return this.userClient
      .send({ cmd: ContractPatterns.FIND_ONE }, { dbName, id })
      .pipe(this.forwardRpcError());
  }

  update(dbName: string, id: string, data: UpdateContractDto): Observable<any> {
    return this.userClient
      .send({ cmd: ContractPatterns.UPDATE }, { dbName, id, data })
      .pipe(this.forwardRpcError());
  }

  delete(dbName: string, id: string): Observable<any> {
    return this.userClient
      .send({ cmd: ContractPatterns.DELETE }, { dbName, id })
      .pipe(this.forwardRpcError());
  }
}
