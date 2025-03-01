import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      return false;
    }

    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Store user info in request
      request.user = decoded;

      // Get the ID from the request parameters
      const userId = request.params.id;

      // Check if user is an admin (admins can access any user)
      if (decoded.role === 'admin') {
        return true;
      }

      // Regular users can only access their own data
      if (decoded.sub === userId) {
        return true;
      }

      throw new ForbiddenException('You can only modify your own user data');
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      return false;
    }
  }
}
