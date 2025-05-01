import { Observable } from 'rxjs';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { Get, Post, Body, Query, Controller } from '@nestjs/common';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';
import { SigninRequestDto } from '../../../../libs/shared/dto/auth/signin.dto';
import { AccessTokenEntity } from 'apps/auth/src/domain/entities/access-token.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authProxy: AuthProxy) {}

  @Get('check-email')
  checkEmail(@Query('email') email: string) {
    console.log({ email });
    return { success: true, exists: true };
    // throw new Error('test');
    // return this.authProxy.findUserByProperty('email', 'test@test.com');
  }

  @Post('signin')
  singin(@Body() input: SigninRequestDto): Observable<AccessTokenEntity> {
    return this.authProxy.signin(input);
  }

  @Post('signup')
  signup(@Body() input: SignupRequestDto): any {
    return this.authProxy.signup(input);
  }

  // @Get('google/callback')
  // @UseGuards()
  // async googleCallback(
  //   @CurrentUser() user: User,
  //   @Res({ passthrough: true }) response: Response,
  // ) {
  //   await this.authService.login(user, response, true);
  // }
}
