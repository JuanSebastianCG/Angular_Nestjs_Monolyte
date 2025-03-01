import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Evaluation, EvaluationDocument } from './schemas/evaluation.schema';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation.name)
    private evaluationModel: Model<EvaluationDocument>,
    private coursesService: CoursesService,
  ) {}

  async create(createEvaluationDto: CreateEvaluationDto): Promise<Evaluation> {
    // Verify course exists
    await this.coursesService.findOne(createEvaluationDto.courseId);

    // Create new evaluation
    const newEvaluation = new this.evaluationModel(createEvaluationDto);
    return newEvaluation.save();
  }

  async findAll(): Promise<Evaluation[]> {
    return this.evaluationModel.find().populate('courseId').exec();
  }

  async findAllByCourse(courseId: string): Promise<Evaluation[]> {
    // Verify course exists
    await this.coursesService.findOne(courseId);

    return this.evaluationModel.find({ courseId }).exec();
  }

  async findOne(id: string): Promise<Evaluation> {
    const evaluation = await this.evaluationModel
      .findById(id)
      .populate('courseId')
      .exec();

    if (!evaluation) {
      throw new NotFoundException(`Evaluation with ID ${id} not found`);
    }

    return evaluation;
  }

  async update(
    id: string,
    updateEvaluationDto: Partial<CreateEvaluationDto>,
  ): Promise<Evaluation> {
    // Verify evaluation exists
    await this.findOne(id);

    // Verify course exists if provided
    if (updateEvaluationDto.courseId) {
      await this.coursesService.findOne(updateEvaluationDto.courseId);
    }

    const updatedEvaluation = await this.evaluationModel
      .findByIdAndUpdate(id, updateEvaluationDto, { new: true })
      .populate('courseId')
      .exec();

    if (!updatedEvaluation) {
      throw new NotFoundException(
        `Evaluation with ID ${id} not found after update`,
      );
    }

    return updatedEvaluation;
  }

  async remove(id: string): Promise<Evaluation> {
    const evaluation = await this.evaluationModel.findByIdAndDelete(id).exec();

    if (!evaluation) {
      throw new NotFoundException(`Evaluation with ID ${id} not found`);
    }

    return evaluation;
  }
}
