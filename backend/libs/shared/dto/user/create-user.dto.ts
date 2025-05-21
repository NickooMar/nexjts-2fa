import {
  IsEmail,
  IsString,
  IsObject,
  MaxLength,
  MinLength,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(15)
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsBoolean()
  @IsNotEmpty()
  emailVerified: boolean;

  @IsObject()
  @IsNotEmpty()
  emailVerification: {
    expiresAt: string;
    code: string;
  };
}
