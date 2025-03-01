import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from './schemas/student.schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { UserService } from '../user/user.service';
import * as mongoose from 'mongoose';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    // Check if user exists
    const user = await this.userService.findOne(createStudentDto.userId);

    // Check if user is already a student
    const existingStudent = await this.studentModel.findOne({
      userId: createStudentDto.userId,
    });
    if (existingStudent) {
      throw new ConflictException('User is already a student');
    }

    // Update user role to student if not already set
    if (user.role !== 'student') {
      await this.userService.update(createStudentDto.userId, {
        role: 'student',
      });
    }

    // Create new student
    const newStudent = new this.studentModel(createStudentDto);
    return newStudent.save();
  }

  async findAll(): Promise<Student[]> {
    return this.studentModel.find().populate('userId', '-password').exec();
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentModel
      .findById(id)
      .populate('userId', '-password')
      .exec();

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async findByUserId(userId: string): Promise<StudentDocument> {
    // When called from UserService, don't populate to avoid circular references
    const student = await this.studentModel.findOne({ userId }).exec();

    if (!student) {
      throw new NotFoundException(`Student with User ID ${userId} not found`);
    }

    return student;
  }

  async update(
    id: string,
    updateStudentDto: Partial<CreateStudentDto>,
  ): Promise<Student> {
    const student = await this.findOne(id);

    if (
      updateStudentDto.userId &&
      updateStudentDto.userId !== student.userId.toString()
    ) {
      // Check if new user exists
      await this.userService.findOne(updateStudentDto.userId);

      // Check if new user is already a student
      const existingStudent = await this.studentModel.findOne({
        userId: updateStudentDto.userId,
      });
      if (
        existingStudent &&
        existingStudent._id &&
        existingStudent._id.toString() !== id
      ) {
        throw new ConflictException('User is already a student');
      }
    }

    const updatedStudent = await this.studentModel
      .findByIdAndUpdate(id, updateStudentDto, { new: true })
      .populate('userId')
      .exec();

    if (!updatedStudent) {
      throw new NotFoundException(
        `Student with ID ${id} not found after update`,
      );
    }

    return updatedStudent;
  }

  async remove(id: string): Promise<Student> {
    const student = await this.studentModel.findByIdAndDelete(id).exec();

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async updateByUserId(
    userId: string,
    updateStudentDto: Partial<CreateStudentDto>,
  ): Promise<Student> {
    try {
      // Find the student by user ID
      const student = await this.studentModel.findOne({ userId }).exec();

      if (!student) {
        throw new NotFoundException(`Student with User ID ${userId} not found`);
      }

      // Update the student
      const updatedStudent = await this.studentModel
        .findByIdAndUpdate(student._id, updateStudentDto, { new: true })
        .populate('userId')
        .exec();

      if (!updatedStudent) {
        throw new NotFoundException(
          `Student with ID ${student._id} not found after update`,
        );
      }

      return updatedStudent;
    } catch (error) {
      // Handle errors
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof mongoose.Error.CastError) {
        throw new BadRequestException(`Invalid user ID format: '${userId}'`);
      }

      this.logger.error(
        `Error updating student by user ID: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error updating student');
    }
  }
}
