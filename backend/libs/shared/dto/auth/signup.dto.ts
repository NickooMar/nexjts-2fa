import {
  IsEmail,
  Matches,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class SignupRequestDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  email: string;

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

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain uppercase, lowercase, number or special character',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  confirmPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  organizationName: string;
}
