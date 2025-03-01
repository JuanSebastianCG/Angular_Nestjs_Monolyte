import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { StudentsService } from '../students/students.service';
import { ProfessorsService } from '../professors/professors.service';
import { EnhancedUser } from './interfaces/enhanced-user.interface';
import { DepartmentsService } from '../departments/departments.service';
import mongoose from 'mongoose';

interface StudentWithId {
  _id: mongoose.Types.ObjectId | string;
  // other properties...
}

interface ProfessorWithId {
  _id: mongoose.Types.ObjectId | string;
  // other properties...
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => StudentsService))
    private studentsService: StudentsService,
    @Inject(forwardRef(() => ProfessorsService))
    private professorsService: ProfessorsService,
    private departmentsService: DepartmentsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const {
      username,
      email,
      password,
      role,
      name,
      birthDate,
      studentInfo,
      professorInfo,
    } = createUserDto;

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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new this.userModel({
      username,
      email,
      name,
      birthDate,
      password: hashedPassword,
      role: role || 'user',
    });

    let savedUser;
    try {
      savedUser = await newUser.save();

      // Create role-specific record if needed
      if (role === 'student' && this.studentsService) {
        try {
          await this.studentsService.create({
            userId: savedUser._id.toString(),
          });
        } catch (error) {
          // Clean up user if student creation fails
          await this.userModel.findByIdAndDelete(savedUser._id);
          throw error;
        }
      } else if (
        role === 'professor' &&
        professorInfo &&
        this.professorsService
      ) {
        try {
          await this.professorsService.create({
            userId: savedUser._id.toString(),
            hiringDate: professorInfo.hiringDate || new Date(),
            departmentId: professorInfo.departmentId,
          });
        } catch (error) {
          // Clean up user if professor creation fails
          await this.userModel.findByIdAndDelete(savedUser._id);
          throw error;
        }
      }

      return savedUser;
    } catch (error) {
      // If any error happens after user creation but before function returns
      if (savedUser && savedUser._id) {
        try {
          await this.userModel.findByIdAndDelete(savedUser._id);
        } catch (cleanupError) {
          console.error(
            'Error cleaning up user after role creation failure:',
            cleanupError,
          );
        }
      }
      throw error;
    }
  }

  async findAll(): Promise<EnhancedUser[]> {
    const users = await this.userModel.find().exec();

    // If we have role-specific services, enhance the user data
    if (this.studentsService || this.professorsService) {
      const enhancedUsers = await Promise.all(
        users.map(async (user) => {
          const userData = user.toObject() as EnhancedUser;

          if (user.role === 'student' && this.studentsService) {
            try {
              const studentInfo = await this.studentsService.findByUserId(
                user._id.toString(),
              );
              // Remove the nested userId object to prevent duplication
              if (studentInfo && studentInfo.userId) {
                // Handle the case when toObject might not be available
                const studentObj =
                  typeof studentInfo.toObject === 'function'
                    ? studentInfo.toObject()
                    : this.convertToPlainObject(studentInfo);

                const { userId, ...studentInfoWithoutUserId } = studentObj;
                userData.studentInfo = studentInfoWithoutUserId;
              } else {
                userData.studentInfo = studentInfo;
              }
            } catch (error) {
              // No student info found
            }
          } else if (user.role === 'professor' && this.professorsService) {
            try {
              const professorInfo = await this.professorsService.findByUserId(
                user._id.toString(),
              );
              // Remove the nested userId object to prevent duplication
              if (professorInfo && professorInfo.userId) {
                // Handle the case when toObject might not be available
                const professorObj =
                  typeof professorInfo.toObject === 'function'
                    ? professorInfo.toObject()
                    : this.convertToPlainObject(professorInfo);

                const { userId, ...professorInfoWithoutUserId } = professorObj;
                userData.professorInfo = professorInfoWithoutUserId;
              } else {
                userData.professorInfo = professorInfo;
              }
            } catch (error) {
              // No professor info found
            }
          }

          return userData;
        }),
      );

      return enhancedUsers;
    }

    return users;
  }

  async findOne(id: string): Promise<EnhancedUser> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const userData = user.toObject() as EnhancedUser;

    // If we have role-specific services, enhance the user data
    if (user.role === 'student' && this.studentsService) {
      try {
        const studentInfo = await this.studentsService.findByUserId(id);
        // Remove the nested userId object to prevent duplication
        if (studentInfo && studentInfo.userId) {
          // Handle the case when toObject might not be available
          const studentObj =
            typeof studentInfo.toObject === 'function'
              ? studentInfo.toObject()
              : this.convertToPlainObject(studentInfo);

          const { userId, ...studentInfoWithoutUserId } = studentObj;
          userData.studentInfo = studentInfoWithoutUserId;
        } else {
          userData.studentInfo = studentInfo;
        }
      } catch (error) {
        // No student info found
      }
    } else if (user.role === 'professor' && this.professorsService) {
      try {
        const professorInfo = await this.professorsService.findByUserId(id);
        // Remove the nested userId object to prevent duplication
        if (professorInfo && professorInfo.userId) {
          // Handle the case when toObject might not be available
          const professorObj =
            typeof professorInfo.toObject === 'function'
              ? professorInfo.toObject()
              : this.convertToPlainObject(professorInfo);

          const { userId, ...professorInfoWithoutUserId } = professorObj;
          userData.professorInfo = professorInfoWithoutUserId;
        } else {
          userData.professorInfo = professorInfo;
        }
      } catch (error) {
        // No professor info found
      }
    }

    return userData;
  }

  // Helper method to convert any object to a plain JavaScript object
  private convertToPlainObject(obj: any): Record<string, any> {
    return JSON.parse(JSON.stringify(obj));
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
    // First, find the user
    const user = await this.findOne(id);

    // Extract role-specific data
    const { studentInfo, professorInfo, ...basicUserInfo } = updateUserDto;

    // Handle basic user data update
    const basicUpdates = { ...basicUserInfo };

    // Update the user's basic information
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, basicUpdates, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found after update`);
    }

    // Handle role-specific updates if provided
    if (user.role === 'student' && studentInfo && this.studentsService) {
      try {
        const student = await this.studentsService.findByUserId(id);
        // Use the updateByUserId method directly instead of update
        if (student) {
          await this.studentsService.updateByUserId(id, studentInfo);
        }
      } catch (error) {
        // Log but don't fail the whole operation
        console.error(`Failed to update student info: ${error.message}`);
      }
    } else if (
      user.role === 'professor' &&
      professorInfo &&
      this.professorsService
    ) {
      try {
        const professor = await this.professorsService.findByUserId(id);
        // Use the updateByUserId method directly instead of update
        if (professor) {
          await this.professorsService.updateByUserId(id, professorInfo);
        }
      } catch (error) {
        // Log but don't fail the whole operation
        console.error(`Failed to update professor info: ${error.message}`);
      }
    }

    // Return the updated user with full role info
    return this.findOne(id);
  }

  async remove(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndDelete(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}
