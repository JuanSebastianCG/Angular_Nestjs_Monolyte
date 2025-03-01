import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Professor, ProfessorDocument } from './schemas/professor.schema';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class ProfessorsService {
  constructor(
    @InjectModel(Professor.name)
    private professorModel: Model<ProfessorDocument>,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
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

    // Create new professor
    const newProfessor = new this.professorModel(createProfessorDto);
    return newProfessor.save();
  }

  async findAll(): Promise<Professor[]> {
    return this.professorModel.find().populate('userId').exec();
  }

  async findOne(id: string): Promise<Professor> {
    const professor = await this.professorModel
      .findById(id)
      .populate('userId')
      .exec();

    if (!professor) {
      throw new NotFoundException(`Professor with ID ${id} not found`);
    }

    return professor;
  }

  async findByUserId(userId: string): Promise<Professor> {
    const professor = await this.professorModel
      .findOne({ userId })
      .populate('userId')
      .exec();

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
    const professor = await this.professorModel.findByIdAndDelete(id).exec();

    if (!professor) {
      throw new NotFoundException(`Professor with ID ${id} not found`);
    }

    return professor;
  }
}
