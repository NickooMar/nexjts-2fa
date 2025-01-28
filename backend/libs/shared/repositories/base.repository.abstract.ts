import { FilterQuery } from 'mongoose';
import { BaseEntity } from './base.entity';

export interface BaseRepositoryAbstract<T extends BaseEntity> {
  findById(id: string): Promise<any>;
  findOne(query: FilterQuery<T>): Promise<any>;
}
