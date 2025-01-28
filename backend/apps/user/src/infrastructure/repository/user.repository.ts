import mongoose from 'mongoose';
import { Injectable } from '@nestjs/common';
import { User } from '../schemas/user.schema';
import { UserRepositoryAbstract } from '../../domain/contracts/user.repository.abstract';
import { BaseRepository } from 'libs/shared/repositories/base.repository';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UserRepository<T extends User>
  extends BaseRepository<T>
  implements UserRepositoryAbstract
{
  constructor(
    @InjectModel(User.name) private readonly userModel: mongoose.Model<T>,
  ) {
    super();
  }

  async findByEmail(email: string): Promise<User> {
    return {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@test.com',
      password: 'password',
      username: 'test',
    };
  }
}
