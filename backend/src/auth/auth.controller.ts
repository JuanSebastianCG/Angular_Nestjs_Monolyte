import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterUserDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // First validate credentials
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    // Then login and get tokens
    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Request() req) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('Refresh token is required');
    }

    const refreshToken = authHeader.split(' ')[1];

    // Changed from refreshToken to refresh to match the new method name
    return this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    const token = req.headers.authorization.split(' ')[1];
    return this.authService.logout(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @Post('validate-token')
  validateToken(@Body() body: { token: string }) {
    return this.authService.validateToken(body.token);
  }
}
