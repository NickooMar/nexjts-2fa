import { Observable } from 'rxjs';
import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';
import { SigninRequestDto } from '../../../../libs/shared/dto/auth/signin.dto';
import { AccessTokenEntity } from 'apps/auth/src/domain/entities/access-token.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authProxy: AuthProxy) {}

  @Get('check-email')
  checkEmail(@Query('email') email: string) {
    console.log({ email });
    throw new NotFoundException('test');
    return { success: true, exists: true };
    // throw new Error('test');
    // return this.authProxy.findUserByProperty('email', 'test@test.com');
  }

  @Post('signin')
  singin(@Body() input: SigninRequestDto): Observable<AccessTokenEntity> {
    return this.authProxy.signin(input);
  }

  @Post('signup')
  signup(@Body() body: any): any {
    console.log({ body });

    throw new Error('test');
    // return this.authProxy.signup(input);
  }
}
