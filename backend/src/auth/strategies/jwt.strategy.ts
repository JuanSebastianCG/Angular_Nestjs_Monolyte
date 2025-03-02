import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    // Extract token from request
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    // Check if token exists in database
    const isValid = await this.authService.validateToken(token);

    if (!isValid) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
