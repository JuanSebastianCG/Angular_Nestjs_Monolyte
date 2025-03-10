import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Evaluation, EvaluationDocument } from './schemas/evaluation.schema';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { CoursesService } from '../courses/courses.service';
import { StudentGradesService } from '../student-grades/student-grades.service';

@Injectable()
export class EvaluationsService {
  private readonly logger = new Logger(EvaluationsService.name);

  constructor(
    @InjectModel(Evaluation.name)
    private evaluationModel: Model<EvaluationDocument>,
    private coursesService: CoursesService,
    @Inject(forwardRef(() => StudentGradesService))
    private studentGradesService: StudentGradesService,
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
    // Verificar que la evaluación existe
    const evaluation = await this.findOne(id);

    // Eliminar todas las calificaciones de estudiantes asociadas a esta evaluación
    try {
      this.logger.log(`Deleting all student grades for evaluation ${id}`);
      const result = await this.studentGradesService.deleteAllForEvaluation(id);
      this.logger.log(
        `Deleted ${result.deletedCount} student grades for evaluation ${id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error deleting student grades for evaluation ${id}: ${error.message}`,
      );
      // Continuamos con la eliminación de la evaluación incluso si hay error con las calificaciones
    }

    // Eliminar la evaluación
    const deletedEvaluation = await this.evaluationModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedEvaluation) {
      throw new NotFoundException(
        `Evaluation with ID ${id} not found during deletion`,
      );
    }

    return deletedEvaluation;
  }
}
