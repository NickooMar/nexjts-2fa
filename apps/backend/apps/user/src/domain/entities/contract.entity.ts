import { BaseEntity } from 'libs/shared/repositories/base.entity';
import {
  ContractType,
  ContractStatus,
  PaymentFrequency,
} from '../../infrastructure/schemas/contract.schema';

export class Contract extends BaseEntity {
  _id: any;

  uuid: string;

  propertyId: any;

  title: string;

  type: ContractType;

  status: ContractStatus;

  startDate?: Date;

  endDate?: Date;

  amount?: number;

  currency?: string;

  paymentFrequency?: PaymentFrequency;

  deposit?: number;

  notes?: string;

  createdBy?: any;

  createdAt: Date;

  updatedAt: Date;
}
