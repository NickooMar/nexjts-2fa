import { Exclude } from 'class-transformer';
import { BaseEntity } from 'libs/shared/repositories/base.entity';

export class User extends BaseEntity {
  _id: any;

  firstName: string;

  lastName: string;

  email: string;

  @Exclude({ toPlainOnly: true })
  password: string;

  emailVerified: boolean;

  emailVerification: {
    code: string;
    expiresAt: string;
  };

  phoneNumber: string;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date;
}
