import { Role } from 'apps/auth/src/domain/entities/role.entity';
import { Exclude } from 'class-transformer';
import { BaseEntity } from 'libs/shared/repositories/base.entity';

export class User extends BaseEntity {
  _id: any;

  firstName: string;

  lastName: string;

  email: string;

  @Exclude({ toPlainOnly: true })
  password: string;

  roles: Role[];

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date;
}
