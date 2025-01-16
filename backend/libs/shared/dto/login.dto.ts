import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  password: string;
}
