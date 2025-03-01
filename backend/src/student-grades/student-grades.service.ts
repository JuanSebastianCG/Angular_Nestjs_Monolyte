import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StudentGrade,
  StudentGradeDocument,
} from './schemas/student-grade.schema';
import { CreateStudentGradeDto } from './dto/create-student-grade.dto';
import { StudentsService } from '../students/students.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';

@Injectable()
export class StudentGradesService {
  constructor(
    @InjectModel(StudentGrade.name)
    private studentGradeModel: Model<StudentGradeDocument>,
    private studentsService: StudentsService,
    private evaluationsService: EvaluationsService,
    private enrollmentsService: EnrollmentsService,
  ) {}

  async create(
    createStudentGradeDto: CreateStudentGradeDto,
  ): Promise<StudentGrade> {
    const { evaluationId, studentId, grade } = createStudentGradeDto;

    // Verify student exists
    await this.studentsService.findOne(studentId);

    // Verify evaluation exists
    const evaluation = await this.evaluationsService.findOne(evaluationId);

    // Check if the grade is within the maximum score for the evaluation
    if (grade > evaluation.maxScore) {
      throw new BadRequestException(
        `Grade cannot exceed the maximum score of ${evaluation.maxScore} for this evaluation`,
      );
    }

    // Verify student is enrolled in the course
    try {
      await this.enrollmentsService.findOne(
        studentId,
        evaluation.courseId.toString(),
      );
    } catch (error) {
      throw new BadRequestException(
        `Student is not enrolled in the course associated with this evaluation`,
      );
    }

    // Check if grade already exists
    const existingGrade = await this.studentGradeModel.findOne({
      evaluationId,
      studentId,
    });

    if (existingGrade) {
      throw new ConflictException(
        'Grade for this student and evaluation already exists',
      );
    }

    // Create new grade
    const newGrade = new this.studentGradeModel(createStudentGradeDto);
    return newGrade.save();
  }

  async findAll(): Promise<StudentGrade[]> {
    return this.studentGradeModel
      .find()
      .populate('evaluationId')
      .populate('studentId')
      .exec();
  }

  async findAllByStudent(studentId: string): Promise<StudentGrade[]> {
    // Verify student exists
    await this.studentsService.findOne(studentId);

    return this.studentGradeModel
      .find({ studentId })
      .populate('evaluationId')
      .exec();
  }

  async findAllByEvaluation(evaluationId: string): Promise<StudentGrade[]> {
    // Verify evaluation exists
    await this.evaluationsService.findOne(evaluationId);

    return this.studentGradeModel
      .find({ evaluationId })
      .populate('studentId')
      .exec();
  }

  async findOne(
    evaluationId: string,
    studentId: string,
  ): Promise<StudentGrade> {
    const grade = await this.studentGradeModel
      .findOne({ evaluationId, studentId })
      .populate('evaluationId')
      .populate('studentId')
      .exec();

    if (!grade) {
      throw new NotFoundException(
        `Grade for student ${studentId} in evaluation ${evaluationId} not found`,
      );
    }

    return grade;
  }

  async update(
    evaluationId: string,
    studentId: string,
    updateStudentGradeDto: Partial<CreateStudentGradeDto>,
  ): Promise<StudentGrade> {
    // Find the grade
    await this.findOne(evaluationId, studentId);

    // Update only fields that don't change the grade identity
    const {
      evaluationId: newEvaluationId,
      studentId: newStudentId,
      ...updateFields
    } = updateStudentGradeDto;

    // If updating grade, verify it's within the maximum score
    if (updateFields.grade) {
      const evaluation = await this.evaluationsService.findOne(evaluationId);
      if (updateFields.grade > evaluation.maxScore) {
        throw new BadRequestException(
          `Grade cannot exceed the maximum score of ${evaluation.maxScore} for this evaluation`,
        );
      }
    }

    const updatedGrade = await this.studentGradeModel
      .findOneAndUpdate({ evaluationId, studentId }, updateFields, {
        new: true,
      })
      .populate('evaluationId')
      .populate('studentId')
      .exec();

    if (!updatedGrade) {
      throw new NotFoundException(
        `Grade for student ${studentId} in evaluation ${evaluationId} not found after update`,
      );
    }

    return updatedGrade;
  }

  async remove(evaluationId: string, studentId: string): Promise<StudentGrade> {
    const grade = await this.studentGradeModel
      .findOneAndDelete({ evaluationId, studentId })
      .exec();

    if (!grade) {
      throw new NotFoundException(
        `Grade for student ${studentId} in evaluation ${evaluationId} not found`,
      );
    }

    return grade;
  }
}
