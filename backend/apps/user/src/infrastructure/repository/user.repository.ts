import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument } from '../schemas/user.schema';
import { User } from '../../domain/entities/user.entity';
import { CreateUserDto } from 'libs/shared/dto/user/create-user.dto';
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

  async findByEmail(email: string): Promise<User | null> {
    const user = await super.findOne({ email }, { password: 0 });
    if (!user) return null;
    return new User(user);
  }

  async create(user: CreateUserDto): Promise<User> {
    const newUser = await super.create(user);
    return new User(newUser);
  }
}
