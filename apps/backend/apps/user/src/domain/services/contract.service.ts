import { from, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { MediaOwnerTypes } from 'apps/constants';
import { Contract } from '../entities/contract.entity';
import { MediaAsset } from '../entities/media-asset.entity';
import { CreateContractDto } from 'libs/shared/dto/contract/create-contract.dto';
import { UpdateContractDto } from 'libs/shared/dto/contract/update-contract.dto';
import { ContractRepository } from '../../infrastructure/repository/contract.repository';
import { MediaAssetRepository } from '../../infrastructure/repository/media-asset.repository';

/** Contract reads are enriched with their media so the gateway needs one RPC. */
export interface ContractWithMedia extends Contract {
  images?: MediaAsset[];
  documents?: MediaAsset[];
}

@Injectable()
export class ContractService {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly mediaRepository: MediaAssetRepository,
  ) {}

  create(
    dbName: string,
    propertyId: string,
    input: CreateContractDto,
    createdBy?: string,
  ): Observable<Contract> {
    return from(
      this.contractRepository.create(dbName, propertyId, input, createdBy),
    );
  }

  findByProperty(
    dbName: string,
    propertyId: string,
  ): Observable<ContractWithMedia[]> {
    return from(
      (async () => {
        const contracts = await this.contractRepository.findByProperty(
          dbName,
          propertyId,
        );
        const media = await this.mediaRepository.findByOwners(
          dbName,
          MediaOwnerTypes.CONTRACT,
          contracts.map((contract) => String(contract._id)),
        );
        return contracts.map((contract) => {
          const assets = media.get(String(contract._id)) ?? [];
          return {
            ...contract,
            images: assets.filter((asset) => asset.kind === 'image'),
            documents: assets.filter((asset) => asset.kind === 'document'),
          };
        });
      })(),
    );
  }

  findOne(dbName: string, id: string): Observable<ContractWithMedia> {
    return from(
      (async () => {
        const contract = await this.contractRepository.findByIdOrUuid(
          dbName,
          id,
        );
        if (!contract) throw new RpcException('contract_not_found');

        const media = await this.mediaRepository.findByOwner(
          dbName,
          MediaOwnerTypes.CONTRACT,
          String(contract._id),
        );
        return {
          ...contract,
          images: media.filter((asset) => asset.kind === 'image'),
          documents: media.filter((asset) => asset.kind === 'document'),
        };
      })(),
    );
  }

  update(
    dbName: string,
    id: string,
    changes: UpdateContractDto,
  ): Observable<Contract> {
    return from(
      (async () => {
        const existing = await this.contractRepository.findByIdOrUuid(
          dbName,
          id,
        );
        if (!existing) throw new RpcException('contract_not_found');

        const updated = await this.contractRepository.update(
          dbName,
          String(existing._id),
          { ...changes },
        );
        if (!updated) throw new RpcException('contract_not_found');
        return updated;
      })(),
    );
  }

  /**
   * Deleting a contract also drops its media metadata. Orphaned storage keys
   * are returned so the gateway (which owns the bucket) purges the objects.
   */
  delete(
    dbName: string,
    id: string,
  ): Observable<{ deleted: boolean; mediaKeys: string[] }> {
    return from(
      (async () => {
        const existing = await this.contractRepository.findByIdOrUuid(
          dbName,
          id,
        );
        if (!existing) throw new RpcException('contract_not_found');

        const removedMedia = await this.mediaRepository.deleteByOwner(
          dbName,
          MediaOwnerTypes.CONTRACT,
          String(existing._id),
        );
        const deleted = await this.contractRepository.delete(
          dbName,
          String(existing._id),
        );
        return {
          deleted,
          mediaKeys: removedMedia.map((asset) => asset.storageKey),
        };
      })(),
    );
  }
}
