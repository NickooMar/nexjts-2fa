import { Observable } from 'rxjs';
import { Controller } from '@nestjs/common';
import { ContractPatterns } from 'apps/constants';
import { MessagePattern } from '@nestjs/microservices';
import { Contract } from '../../domain/entities/contract.entity';
import { CreateContractDto } from 'libs/shared/dto/contract/create-contract.dto';
import { UpdateContractDto } from 'libs/shared/dto/contract/update-contract.dto';
import {
  ContractService,
  ContractWithMedia,
} from '../../domain/services/contract.service';

/**
 * Every payload carries the resolved tenant `dbName` (derived from the JWT by
 * the gateway) so the service reads/writes the correct tenant database.
 */
@Controller()
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @MessagePattern({ cmd: ContractPatterns.CREATE })
  create(payload: {
    dbName: string;
    propertyId: string;
    createdBy?: string;
    data: CreateContractDto;
  }): Observable<Contract> {
    return this.contractService.create(
      payload.dbName,
      payload.propertyId,
      payload.data,
      payload.createdBy,
    );
  }

  @MessagePattern({ cmd: ContractPatterns.FIND_BY_PROPERTY })
  findByProperty(payload: {
    dbName: string;
    propertyId: string;
  }): Observable<ContractWithMedia[]> {
    return this.contractService.findByProperty(
      payload.dbName,
      payload.propertyId,
    );
  }

  @MessagePattern({ cmd: ContractPatterns.FIND_ONE })
  findOne(payload: {
    dbName: string;
    id: string;
  }): Observable<ContractWithMedia> {
    return this.contractService.findOne(payload.dbName, payload.id);
  }

  @MessagePattern({ cmd: ContractPatterns.UPDATE })
  update(payload: {
    dbName: string;
    id: string;
    data: UpdateContractDto;
  }): Observable<Contract> {
    return this.contractService.update(
      payload.dbName,
      payload.id,
      payload.data,
    );
  }

  @MessagePattern({ cmd: ContractPatterns.DELETE })
  delete(payload: {
    dbName: string;
    id: string;
  }): Observable<{ deleted: boolean; mediaKeys: string[] }> {
    return this.contractService.delete(payload.dbName, payload.id);
  }
}
