import { BaseEntity } from './base.entity';
import { InternalServerErrorException } from '@nestjs/common';
import { FilterQuery, Model, SaveOptions, Types } from 'mongoose';
import { BaseRepositoryAbstract } from './base.repository.abstract';

export class BaseRepository<T extends BaseEntity>
  implements BaseRepositoryAbstract<T>
{
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<Model<T>> {
    return this.model.findById(id);
  }

  async findOne(query: FilterQuery<T>): Promise<Model<T>> {
    const item = await this.model.findOne(query).exec();
    if (!item) return null;
    return item['_doc'];
  }

  async create(
    document: any,
    projection?: any,
    options?: SaveOptions,
  ): Promise<any> {
    const item = new this.model(
      {
        ...document,
        _id: new Types.ObjectId(),
      },
      projection,
      options,
    );
    const saved = await item?.save();
    if (saved) return saved;
    else throw new InternalServerErrorException();
  }
}
