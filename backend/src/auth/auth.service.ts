import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthToken, AuthTokenDocument } from './schemas/auth-token.schema';
import { User } from '../user/schemas/user.schema';
import { StudentsService } from '../students/students.service';
import { ProfessorsService } from '../professors/professors.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectModel(AuthToken.name)
    private authTokenModel: Model<AuthTokenDocument>,
    private studentsService: StudentsService,
    private professorsService: ProfessorsService,
    private configService: ConfigService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const {
      username,
      email,
      password,
      role,
      name,
      birthDate,
      studentInfo,
      professorInfo,
    } = registerUserDto;

    // Validate role-specific info
    if (role === 'student' && !studentInfo) {
      throw new BadRequestException(
        'Student information is required for student role',
      );
    }

    if (role === 'professor' && !professorInfo) {
      throw new BadRequestException(
        'Professor information is required for professor role',
      );
    }

    // Create the user
    const user = await this.userService.create({
      username,
      email,
      password,
      name,
      birthDate,
      role,
    });

    // Create the role-specific record
    if (role === 'student') {
      await this.studentsService.create({
        userId: user._id?.toString() || '',
      });
    } else if (role === 'professor' && professorInfo) {
      await this.professorsService.create({
        userId: user._id?.toString() || '',
        hiringDate: new Date(),
        department: professorInfo.department,
      });
    }

    return {
      message: 'User registered successfully',
      user: {
        _id: user._id,
        name: user.name,
        birthDate: user.birthDate,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.userService.findByUsername(username);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken, expiresIn, refreshExpiresIn } =
      await this.generateTokens(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      refresh_expires_in: refreshExpiresIn,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Find the token in the database
      const tokenDoc = await this.authTokenModel
        .findOne({ refreshToken })
        .exec();

      if (!tokenDoc) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if refresh token is expired
      if (new Date() > tokenDoc.refreshExpiresAt) {
        await this.authTokenModel.deleteOne({ refreshToken });
        throw new UnauthorizedException('Refresh token expired');
      }

      // Get the user
      const user = await this.userService.findOne(tokenDoc.userId.toString());

      // Generate new tokens
      const {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
        refreshExpiresIn,
      } = await this.generateTokens(user);

      // Delete the old token
      await this.authTokenModel.deleteOne({ refreshToken });

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: expiresIn,
        refresh_expires_in: refreshExpiresIn,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: User) {
    // Create payload for JWT
    const payload = { sub: user._id, username: user.username, role: user.role };

    // Get token expiration times from config or use defaults
    const accessTokenExpiration =
      this.configService.get<string>('JWT_EXPIRATION') || '1h';
    const refreshTokenExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    // Calculate expiration dates
    const expiresAt = this.calculateExpirationDate(accessTokenExpiration);
    const refreshExpiresAt = this.calculateExpirationDate(
      refreshTokenExpiration,
    );

    // Generate tokens
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiration,
    });
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: refreshTokenExpiration },
    );

    // Store tokens in database
    await this.authTokenModel.create({
      token: accessToken,
      refreshToken,
      userId: user._id,
      expiresAt,
      refreshExpiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getExpirationSeconds(accessTokenExpiration),
      refreshExpiresIn: this.getExpirationSeconds(refreshTokenExpiration),
    };
  }

  private calculateExpirationDate(expiration: string): Date {
    const seconds = this.getExpirationSeconds(expiration);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + seconds);
    return expiresAt;
  }

  private getExpirationSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default to 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 3600;
    }
  }

  async logout(token: string): Promise<{ success: boolean }> {
    // Find the token document
    const tokenDoc = await this.authTokenModel.findOne({ token }).exec();

    if (tokenDoc) {
      // Remove token from database
      await this.authTokenModel.deleteOne({ _id: tokenDoc._id });
    }

    return { success: true };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      // Verify token with JWT service
      const decoded = this.jwtService.verify(token);

      // Check if token exists and is not expired
      const authToken = await this.authTokenModel.findOne({
        token,
        userId: decoded.sub,
        expiresAt: { $gt: new Date() },
      });

      return !!authToken;
    } catch (error) {
      return false;
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.authTokenModel.deleteMany({ userId });
  }

  async getProfile(userId: string) {
    const user = await this.userService.findOne(userId);

    return {
      _id: user._id,
      name: user.name,
      birthDate: user.birthDate,
      username: user.username,
      email: user.email,
      role: user.role,
      roleInfo: user.role === 'student' ? user.studentInfo : user.professorInfo,
    };
  }
}
