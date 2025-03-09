import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { Professor, ProfessorDocument } from './schemas/professor.schema';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UserService } from '../user/user.service';
import { DepartmentsService } from '../departments/departments.service';
import { HttpException } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class ProfessorsService {
  private readonly logger = new Logger(ProfessorsService.name);

  constructor(
    @InjectModel(Professor.name)
    private professorModel: Model<ProfessorDocument>,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private departmentsService: DepartmentsService,
    @Inject(forwardRef(() => CoursesService))
    private coursesService: CoursesService,
  ) {}

  async create(createProfessorDto: CreateProfessorDto): Promise<Professor> {
    // Check if user exists
    const user = await this.userService.findOne(createProfessorDto.userId);

    // Check if user is already a professor
    const existingProfessor = await this.professorModel.findOne({
      userId: createProfessorDto.userId,
    });
    if (existingProfessor) {
      throw new ConflictException('User is already a professor');
    }

    // Update user role to professor if not already set
    if (user.role !== 'professor') {
      await this.userService.update(createProfessorDto.userId, {
        role: 'professor',
      });
    }

    // Validate departmentId is provided
    if (!createProfessorDto.departmentId) {
      throw new BadRequestException('Department ID is required for professors');
    }

    // Verify department exists
    try {
      await this.departmentsService.findOne(createProfessorDto.departmentId);
    } catch (error) {
      throw new BadRequestException(
        `Department with ID ${createProfessorDto.departmentId} not found. Please use an existing department ID.`,
      );
    }

    // Set hiring date to current date if not provided
    const professorData = {
      ...createProfessorDto,
      hiringDate: createProfessorDto.hiringDate || new Date(),
    };

    // Create professor
    const newProfessor = new this.professorModel(professorData);
    return newProfessor.save();
  }

  async findAll(): Promise<Professor[]> {
    return this.professorModel
      .find()
      .populate('userId', '-password')
      .populate('departmentId')
      .exec();
  }

  async findOne(id: string): Promise<Professor> {
    try {
      // Check if the ID is a valid ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid professor ID format: '${id}'`);
      }

      const professor = await this.professorModel
        .findById(id)
        .populate('userId', '-password')
        .populate('departmentId')
        .exec();

      if (!professor) {
        throw new NotFoundException(`Professor with ID ${id} not found`);
      }

      return professor;
    } catch (error) {
      // Rethrow NestJS exceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle Mongoose cast errors
      if (error instanceof mongoose.Error.CastError) {
        throw new BadRequestException(`Invalid professor ID format: '${id}'`);
      }

      // Log and rethrow other errors
      this.logger.error(
        `Error finding professor: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error retrieving professor');
    }
  }

  async findByUserId(userId: string): Promise<ProfessorDocument> {
    // When called from UserService, don't populate to avoid circular references
    const professor = await this.professorModel.findOne({ userId }).exec();

    if (!professor) {
      throw new NotFoundException(`Professor with User ID ${userId} not found`);
    }

    return professor;
  }

  async update(
    id: string,
    updateProfessorDto: Partial<CreateProfessorDto>,
  ): Promise<Professor> {
    const professor = await this.findOne(id);

    if (
      updateProfessorDto.userId &&
      updateProfessorDto.userId !== professor.userId.toString()
    ) {
      // Check if new user exists
      await this.userService.findOne(updateProfessorDto.userId);

      // Check if new user is already a professor
      const existingProfessor = await this.professorModel.findOne({
        userId: updateProfessorDto.userId,
      });
      if (
        existingProfessor &&
        existingProfessor._id &&
        existingProfessor._id.toString() !== id
      ) {
        throw new ConflictException('User is already a professor');
      }
    }

    const updatedProfessor = await this.professorModel
      .findByIdAndUpdate(id, updateProfessorDto, { new: true })
      .populate('userId')
      .exec();

    if (!updatedProfessor) {
      throw new NotFoundException(
        `Professor with ID ${id} not found after update`,
      );
    }

    return updatedProfessor;
  }

  async remove(id: string): Promise<Professor> {
    // First check if the professor has any active courses
    const professor = await this.professorModel.findById(id).exec();

    if (!professor) {
      throw new NotFoundException(`Professor with ID ${id} not found`);
    }

    // Check if the professor has any active courses using the coursesService
    try {
      const activeCourses = await this.coursesService.findAll({
        professorId: id,
      });

      if (activeCourses && activeCourses.length > 0) {
        throw new ConflictException(
          `Cannot delete professor with ID ${id} because they have ${activeCourses.length} active courses assigned. Please reassign or delete the courses first.`,
        );
      }
    } catch (error) {
      // If the error is not a ConflictException, it's likely a service error
      if (!(error instanceof ConflictException)) {
        this.logger.error(
          `Error checking for active courses: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          'Error checking for active courses',
        );
      }
      throw error;
    }

    // No active courses, proceed with deletion
    const deletedProfessor = await this.professorModel
      .findByIdAndDelete(id)
      .exec();

    // Add null check to satisfy TypeScript
    if (!deletedProfessor) {
      throw new InternalServerErrorException(
        `Professor with ID ${id} was found but could not be deleted`,
      );
    }

    return deletedProfessor;
  }

  async updateByUserId(
    userId: string,
    updateProfessorDto: Partial<CreateProfessorDto>,
  ): Promise<Professor> {
    try {
      // Find the professor by user ID
      const professor = await this.professorModel.findOne({ userId }).exec();

      if (!professor) {
        throw new NotFoundException(
          `Professor with User ID ${userId} not found`,
        );
      }

      // Validate department if provided
      if (updateProfessorDto.departmentId) {
        try {
          await this.departmentsService.findOne(
            updateProfessorDto.departmentId,
          );
        } catch (error) {
          throw new BadRequestException(
            `Department with ID ${updateProfessorDto.departmentId} not found. Please use an existing department ID.`,
          );
        }
      }

      // Update the professor
      const updatedProfessor = await this.professorModel
        .findByIdAndUpdate(professor._id, updateProfessorDto, { new: true })
        .populate('userId')
        .populate('departmentId')
        .exec();

      if (!updatedProfessor) {
        throw new NotFoundException(
          `Professor with ID ${professor._id} not found after update`,
        );
      }

      return updatedProfessor;
    } catch (error) {
      // Handle errors
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      if (error instanceof mongoose.Error.CastError) {
        throw new BadRequestException(`Invalid user ID format: '${userId}'`);
      }

      this.logger.error(
        `Error updating professor by user ID: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error updating professor');
    }
  }
}
