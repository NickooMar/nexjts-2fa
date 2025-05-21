import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument } from '../schemas/user.schema';
import { User } from '../../domain/entities/user.entity';
import { CreateUserDto } from 'libs/shared/dto/user/create-user.dto';
import { UpdateUserDto } from 'libs/shared/dto/user/update-user.dto';
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

  async findById(id: string): Promise<User | null> {
    const user = await super.findOne(
      { _id: new Types.ObjectId(id) },
      { password: 0 },
    );
    if (!user) return null;
    return new User(user);
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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await super.updateById(id, updateUserDto);
    console.log({ updatedUser });
    return new User(updatedUser);
  }
}
