import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { UserDocument } from '../schemas/user.schema';
import { User } from '../../domain/entities/user.entity';
import { SigninRequestDto } from 'libs/shared/dto/auth/signin.dto';
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

  async findByEmailAndPassword(input: SigninRequestDto): Promise<User | null> {
    const user = await super.findOne({ email: input.email });
    if (!user) throw new RpcException('user_not_found');

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) throw new RpcException('invalid_credentials');
    if (!user.emailVerified) throw new RpcException('email_not_verified');

    return new User(user);
  }

  async create(user: CreateUserDto): Promise<User> {
    const newUser = await super.create(user);
    return new User(newUser);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await super.updateById(id, updateUserDto);
    return new User(updatedUser);
  }
}
