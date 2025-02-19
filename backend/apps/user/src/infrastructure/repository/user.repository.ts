import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument } from '../schemas/user.schema';
import { User } from '../../domain/entities/user.entity';
import { BaseRepository } from 'libs/shared/repositories/base.repository';
import { UserRepositoryAbstract } from '../../domain/contracts/user.repository.abstract';

@Injectable()
export class UserRepository<T extends UserDocument>
  extends BaseRepository<T>
  implements UserRepositoryAbstract
{
  constructor(@InjectModel(User.name) protected readonly userModel: Model<T>) {
    super(userModel);
  }

  async findByEmail(email: string): Promise<User> {
    const user = await super.findOne({ email });
    return new User(user);
  }
}
