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
import { DepartmentsService } from '../departments/departments.service';

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
    private departmentsService: DepartmentsService,
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

    // For professors, verify department exists before user creation
    if (role === 'professor' && professorInfo) {
      try {
        // Verify department exists (will throw if not found)
        await this.departmentsService.findOne(professorInfo.departmentId);
      } catch (error) {
        throw new BadRequestException(
          `Department with ID ${professorInfo.departmentId} not found. Please use an existing department ID.`,
        );
      }
    }

    let user;
    try {
      // Create the user
      user = await this.userService.create({
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
        try {
          await this.professorsService.create({
            userId: user._id?.toString() || '',
            hiringDate: professorInfo.hiringDate || new Date(),
            departmentId: professorInfo.departmentId,
          });
        } catch (error) {
          // If professor creation fails, delete the user and rethrow
          await this.userService.remove(user._id?.toString());
          throw error;
        }
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
    } catch (error) {
      // If any error occurs after user creation but before completing registration
      if (user && user._id) {
        try {
          await this.userService.remove(user._id.toString());
        } catch (cleanupError) {
          console.error(
            'Failed to clean up user after registration error:',
            cleanupError,
          );
        }
      }

      // Rethrow the original error
      throw error;
    }
  }

  async validateUser(username: string, password: string): Promise<any> {
    try {
      const user = await this.userService.findByUsername(username);

      if (user && (await bcrypt.compare(password, user.password))) {
        // Create a new object without the password
        const { password, ...result } = JSON.parse(JSON.stringify(user));
        return result;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async login(user: any, deviceId?: string) {
    const payload = {
      username: user.username,
      sub: user._id,
      role: user.role || 'user',
      // Include device ID in payload if provided
      ...(deviceId && { device: deviceId }),
    };

    // If deviceId is provided, revoke only tokens for that device
    if (deviceId) {
      await this.authTokenModel.deleteMany({
        userId: user._id,
        deviceId: deviceId,
      });
    }

    // Generate tokens
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Calculate expiration dates
    const accessTokenExpiry = new Date();
    accessTokenExpiry.setHours(accessTokenExpiry.getHours() + 1);

    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    // Save tokens to database
    await this.authTokenModel.create({
      userId: user._id,
      token: accessToken,
      refreshToken: refreshToken,
      deviceId: deviceId, // Store device ID if provided
      expiresAt: accessTokenExpiry,
      refreshExpiresAt: refreshTokenExpiry,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async refresh(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.userService.findOne(decoded.sub);

      // Find and delete the old refresh token
      await this.authTokenModel.deleteOne({ refreshToken: token });

      // Generate new tokens and save them
      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<{ success: boolean }> {
    try {
      // Find and remove the token
      const result = await this.authTokenModel.deleteOne({ token });

      return { success: result.deletedCount > 0 };
    } catch (error) {
      console.error('Error during logout:', error);
      return { success: false };
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      // First verify the token is structurally valid
      const decoded = this.jwtService.verify(token);

      // Then check if it exists in the database and is not expired
      const authToken = await this.authTokenModel.findOne({
        token,
        userId: decoded.sub,
        expiresAt: { $gt: new Date() },
      });

      // Return true only if the token exists in the database
      return !!authToken;
    } catch (error) {
      console.error('Token validation error:', error.message);
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
