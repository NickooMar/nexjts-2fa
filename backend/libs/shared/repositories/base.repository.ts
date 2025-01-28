import { FilterQuery, Model } from 'mongoose';
import { BaseEntity } from './base.entity';
import { BaseRepositoryAbstract } from './base.repository.abstract';

export class BaseRepository<T extends BaseEntity>
  implements BaseRepositoryAbstract<T>
{
  constructor() {}

  protected readonly model: Model<T>;

  async findById(id: string): Promise<Model<T>> {
    return this.model.findById(id);
  }

  async findOne(query: FilterQuery<T>): Promise<Model<T>> {
    return this.model.findOne(query);
  }
}
