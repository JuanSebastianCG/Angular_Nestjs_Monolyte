import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from './schemas/student.schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
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
    return this.studentModel.find().populate('userId').exec();
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentModel
      .findById(id)
      .populate('userId')
      .exec();

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async findByUserId(userId: string): Promise<Student> {
    const student = await this.studentModel
      .findOne({ userId })
      .populate('userId')
      .exec();

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
}
