import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { StudentsService } from '../students/students.service';
import { ProfessorsService } from '../professors/professors.service';
import { EnhancedUserData } from './interfaces/enhanced-user.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private studentsService?: StudentsService,
    private professorsService?: ProfessorsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, password, role, studentInfo, professorInfo } =
      createUserDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Validate role
    if (role && !['student', 'professor'].includes(role)) {
      throw new ConflictException(
        'Role must be either "student" or "professor"',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new this.userModel({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    const savedUser = await newUser.save();

    // Create role-specific record if needed
    if (role === 'student' && studentInfo && this.studentsService) {
      await this.studentsService.create({
        userId: savedUser._id.toString(),
        name: studentInfo.name,
        birthDate: new Date(studentInfo.birthDate),
      });
    } else if (
      role === 'professor' &&
      professorInfo &&
      this.professorsService
    ) {
      await this.professorsService.create({
        userId: savedUser._id.toString(),
        name: professorInfo.name,
        hiringDate: new Date(),
        department: professorInfo.department,
      });
    }

    return savedUser;
  }

  async findAll(): Promise<EnhancedUserData[]> {
    const users = await this.userModel.find().exec();

    // If we have role-specific services, enhance the user data
    if (this.studentsService || this.professorsService) {
      const enhancedUsers = await Promise.all(
        users.map(async (user) => {
          const userData = user.toObject() as EnhancedUserData;

          if (user.role === 'student' && this.studentsService) {
            try {
              userData.studentInfo = await this.studentsService.findByUserId(
                user._id.toString(),
              );
            } catch (error) {
              // No student info found
            }
          } else if (user.role === 'professor' && this.professorsService) {
            try {
              userData.professorInfo =
                await this.professorsService.findByUserId(user._id.toString());
            } catch (error) {
              // No professor info found
            }
          }

          return userData;
        }),
      );

      return enhancedUsers;
    }

    return users.map((user) => user.toObject() as EnhancedUserData);
  }

  async findOne(id: string): Promise<EnhancedUserData> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const userData = user.toObject() as EnhancedUserData;

    // If we have role-specific services, enhance the user data
    if (user.role === 'student' && this.studentsService) {
      try {
        userData.studentInfo = await this.studentsService.findByUserId(id);
      } catch (error) {
        // No student info found
      }
    } else if (user.role === 'professor' && this.professorsService) {
      try {
        userData.professorInfo = await this.professorsService.findByUserId(id);
      } catch (error) {
        // No professor info found
      }
    }

    return userData;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(
    id: string,
    updateUserDto: Partial<CreateUserDto>,
  ): Promise<User> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // If updating password, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found after update`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndDelete(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}
