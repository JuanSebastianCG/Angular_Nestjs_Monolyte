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

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectModel(AuthToken.name)
    private authTokenModel: Model<AuthTokenDocument>,
    private studentsService: StudentsService,
    private professorsService: ProfessorsService,
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

    const payload = { sub: user._id, username: user.username, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(token: string): Promise<{ success: boolean }> {
    // Remove token from database
    await this.authTokenModel.deleteOne({ token });
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
