import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserProxy } from 'apps/user/src/infrastructure/external/user.proxy';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userProxy: UserProxy,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.userProxy
      .findById(payload.sub)
      .pipe(catchError(() => throwError(() => new UnauthorizedException())))
      .toPromise();

    // Attach the signed tenant claims (resolved from the user's membership at
    // token time) so downstream handlers can route requests to the correct
    // tenant database without re-querying.
    return {
      ...user,
      role: payload.role,
      tenantId: payload.tenantId,
      tenantSlug: payload.tenantSlug,
      tenantDb: payload.tenantDb,
      tenantName: payload.tenantName,
    };
  }
}
