import {
  IsEmail,
  IsString,
  IsObject,
  MaxLength,
  MinLength,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { TokensEntity } from 'apps/auth/src/domain/entities/tokens.entity';

export class SigninRequestDto {
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

// export class SigninResponseDto {
//   @IsBoolean()
//   @IsNotEmpty()
//   success: boolean;

//   @IsObject()
//   @IsNotEmpty()
//   user: {
//     email: string;
//     firstName: string;
//     lastName: string;
//   };

//   @IsObject()
//   @IsNotEmpty()
//   tokens: TokensEntity;
// }
