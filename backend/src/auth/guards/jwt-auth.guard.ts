import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private authService: AuthService;

  constructor(private moduleRef: ModuleRef) {
    super();
  }

  // This will be called when the guard is first used
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lazy-load the AuthService to avoid circular dependency issues
    if (!this.authService) {
      this.authService = this.moduleRef.get(AuthService, { strict: false });
    }

    // First, check if the JWT is valid using the standard JWT strategy
    const isValidJwt = await super.canActivate(context);

    if (!isValidJwt) {
      return false;
    }

    // If JWT is valid, also check if it exists in the database
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Check if token exists in database and is not revoked
    const isValidInDb = await this.authService.validateToken(token);

    if (!isValidInDb) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
