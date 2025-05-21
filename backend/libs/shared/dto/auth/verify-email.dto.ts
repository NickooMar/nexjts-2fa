import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyEmailRequestDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @Length(6)
  code: string;
}
