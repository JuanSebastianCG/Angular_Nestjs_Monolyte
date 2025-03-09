import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StudentGrade,
  StudentGradeDocument,
} from './schemas/student-grade.schema';
import { CreateStudentGradeDto } from './dto/create-student-grade.dto';
import { StudentsService } from '../students/students.service';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { UserService } from '../user/user.service';

@Injectable()
export class StudentGradesService {
  constructor(
    @InjectModel(StudentGrade.name)
    private studentGradeModel: Model<StudentGradeDocument>,
    private studentsService: StudentsService,
    private evaluationsService: EvaluationsService,
    private enrollmentsService: EnrollmentsService,
    private userService: UserService,
  ) {}

  async create(
    createStudentGradeDto: CreateStudentGradeDto,
  ): Promise<StudentGrade> {
    const { studentId, evaluationId, grade } = createStudentGradeDto;

    // Verify user exists
    await this.userService.findOne(studentId);

    // Verify evaluation exists
    const evaluation = await this.evaluationsService.findOne(evaluationId);

    // Check if the grade is within the maximum score
    if (grade > evaluation.maxScore) {
      throw new BadRequestException(
        `Grade cannot exceed the maximum score of ${evaluation.maxScore}`,
      );
    }

    // Extract the course ID properly
    let courseIdStr: string;
    if (
      typeof evaluation.courseId === 'object' &&
      evaluation.courseId !== null
    ) {
      // If it's a populated object
      if ('_id' in evaluation.courseId) {
        courseIdStr = (evaluation.courseId._id as any).toString();
      } else {
        courseIdStr = (evaluation.courseId as any).toString();
      }
    } else {
      courseIdStr = String(evaluation.courseId);
    }

    try {
      // Instead of using the service, query the database directly
      const enrollment = await this.enrollmentsService.findOne(
        studentId,
        courseIdStr,
      );

      if (!enrollment) {
        throw new NotFoundException(
          `No enrollment found for student ${studentId} in course ${courseIdStr}`,
        );
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
      throw new NotFoundException(
        `Student is not enrolled in the course for this evaluation`,
      );
    }

    // Create the grade with proper ObjectId conversions
    const newGrade = new this.studentGradeModel({
      studentId: new Types.ObjectId(studentId),
      evaluationId: new Types.ObjectId(evaluationId),
      grade,
      comments: createStudentGradeDto.comments,
    });

    return newGrade.save();
  }

  async findAll(): Promise<StudentGrade[]> {
    return this.studentGradeModel
      .find()
      .populate('studentId')
      .populate('evaluationId')
      .exec();
  }

  async findAllByStudent(userId: string): Promise<StudentGrade[]> {
    // Verify user exists
    await this.userService.findOne(userId);

    return this.studentGradeModel
      .find({ studentId: new Types.ObjectId(userId) })
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

  async findOne(evaluationId: string, userId: string): Promise<StudentGrade> {
    const grade = await this.studentGradeModel
      .findOne({
        evaluationId: new Types.ObjectId(evaluationId),
        studentId: new Types.ObjectId(userId),
      })
      .populate('studentId')
      .populate('evaluationId')
      .exec();

    if (!grade) {
      throw new NotFoundException(
        `Grade for student ${userId} in evaluation ${evaluationId} not found`,
      );
    }

    return grade;
  }

  async update(
    evaluationId: string,
    userId: string,
    updateStudentGradeDto: Partial<CreateStudentGradeDto>,
  ): Promise<StudentGrade> {
    // Find the grade
    await this.findOne(evaluationId, userId);

    // Update only allowed fields
    const {
      studentId,
      evaluationId: newEvalId,
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
      .findOneAndUpdate({ evaluationId, studentId: userId }, updateFields, {
        new: true,
      })
      .populate('studentId')
      .populate('evaluationId')
      .exec();

    if (!updatedGrade) {
      throw new NotFoundException(
        `Grade for student ${userId} in evaluation ${evaluationId} not found after update`,
      );
    }

    return updatedGrade;
  }

  async remove(evaluationId: string, userId: string): Promise<StudentGrade> {
    const grade = await this.studentGradeModel
      .findOneAndDelete({ evaluationId, studentId: userId })
      .exec();

    if (!grade) {
      throw new NotFoundException(
        `Grade for student ${userId} in evaluation ${evaluationId} not found`,
      );
    }

    return grade;
  }
}
