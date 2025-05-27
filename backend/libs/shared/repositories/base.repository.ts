import {
  Types,
  Model,
  SaveOptions,
  UpdateQuery,
  FilterQuery,
  QueryOptions,
} from 'mongoose';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BaseEntity } from './base.entity';
import { BaseRepositoryAbstract } from './base.repository.abstract';

export class BaseRepository<T extends BaseEntity>
  implements BaseRepositoryAbstract<T>
{
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<any> {
    return this.model.findById(id);
  }

  async findOne(query: FilterQuery<T>, projection?: any): Promise<T> {
    const item = await this.model.findOne(query, projection).exec();
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

  async updateById(
    id: any,
    update?: UpdateQuery<T>,
    options?: QueryOptions<T>,
  ): Promise<T> {
    if (typeof id === 'string') {
      id = new Types.ObjectId(id);
    }
    const item = await this.model.findById(id);
    if (!item) throw new NotFoundException();
    return await this.model.findByIdAndUpdate(id, update, {
      new: true,
      ...options,
    });
  }
}
