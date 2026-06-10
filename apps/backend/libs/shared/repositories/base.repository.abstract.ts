import { BaseEntity } from './base.entity';
import { FilterQuery, QueryOptions, SaveOptions, UpdateQuery } from 'mongoose';

export interface BaseRepositoryAbstract<T extends BaseEntity> {
  findById(id: string): Promise<T>;
  findOne(query: FilterQuery<T>): Promise<T>;
  create(document: any, projection?: any, options?: SaveOptions): Promise<T>;
  updateById(
    id: any,
    update?: UpdateQuery<T>,
    options?: QueryOptions<T>,
  ): Promise<T>;
}
