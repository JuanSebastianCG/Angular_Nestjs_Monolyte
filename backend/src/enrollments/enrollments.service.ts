import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Enrollment,
  EnrollmentDocument,
  wEnrollmentStatus,
} from './schemas/enrollment.schema';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { StudentsService } from '../students/students.service';
import { CoursesService } from '../courses/courses.service';
import { UserService } from '../user/user.service';
import { PrerequisitesService } from '../prerequisites/prerequisites.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    private studentsService: StudentsService,
    private coursesService: CoursesService,
    private userService: UserService,
    private prerequisitesService: PrerequisitesService,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    const { studentId, courseId } = createEnrollmentDto;

    // Verify user exists
    await this.userService.findOne(studentId);

    // Verify course exists
    await this.coursesService.findOne(courseId);

    // Check prerequisites
    const prerequisitesCheck =
      await this.prerequisitesService.checkPrerequisitesForEnrollment(
        courseId,
        studentId,
        this,
      );

    if (!prerequisitesCheck.isValid) {
      throw new BadRequestException(
        `Cannot enroll in this course. Missing prerequisites: ${prerequisitesCheck.missingCourses.join(', ')}`,
      );
    }

    // Check if enrollment already exists
    const existingEnrollment = await this.enrollmentModel.findOne({
      studentId,
      courseId,
    });

    if (existingEnrollment) {
      throw new ConflictException('User is already enrolled in this course');
    }

    // Create new enrollment
    const newEnrollment = new this.enrollmentModel({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      enrollmentStartDate:
        createEnrollmentDto.enrollmentStartDate || new Date(),
      enrollmentEndDate: createEnrollmentDto.enrollmentEndDate,
      status: wEnrollmentStatus.START,
    });

    return newEnrollment.save();
  }

  async findAll(): Promise<Enrollment[]> {
    return this.enrollmentModel
      .find()
      .populate('studentId')
      .populate('courseId')
      .exec();
  }

  async findAllByStudent(userId: string): Promise<Enrollment[]> {
    // Verify user exists
    await this.userService.findOne(userId);

    return this.enrollmentModel
      .find({ studentId: new Types.ObjectId(userId) })
      .populate('courseId')
      .exec();
  }

  async findAllByCourse(courseId: string): Promise<Enrollment[]> {
    // Verify course exists
    await this.coursesService.findOne(courseId);

    return this.enrollmentModel.find({ courseId }).populate('studentId').exec();
  }

  async findOne(userId: string, courseId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findOne({
        studentId: new Types.ObjectId(userId),
        courseId: new Types.ObjectId(courseId),
      })
      .populate('studentId')
      .populate('courseId')
      .exec();

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment for user ${userId} in course ${courseId} not found`,
      );
    }

    return enrollment;
  }

  async update(
    userId: string,
    courseId: string,
    updateEnrollmentDto: Partial<CreateEnrollmentDto>,
  ): Promise<Enrollment> {
    // Find the enrollment
    await this.findOne(userId, courseId);

    // Update only fields that don't change the enrollment identity
    const {
      studentId: newStudentId,
      courseId: newCourseId,
      ...updateFields
    } = updateEnrollmentDto;

    const updatedEnrollment = await this.enrollmentModel
      .findOneAndUpdate(
        {
          studentId: new Types.ObjectId(userId),
          courseId: new Types.ObjectId(courseId),
        },
        updateFields,
        { new: true },
      )
      .populate('studentId')
      .populate('courseId')
      .exec();

    if (!updatedEnrollment) {
      throw new NotFoundException(
        `Enrollment for user ${userId} in course ${courseId} not found after update`,
      );
    }

    return updatedEnrollment;
  }

  async remove(userId: string, courseId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findOneAndDelete({ studentId: userId, courseId })
      .exec();

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment for user ${userId} in course ${courseId} not found`,
      );
    }

    return enrollment;
  }

  async finishAllForStudent(studentId: string): Promise<{ updated: number }> {
    // Verify user exists
    await this.userService.findOne(studentId);

    // Update all enrollments for this student to 'finish' status
    const result = await this.enrollmentModel.updateMany(
      { studentId: new Types.ObjectId(studentId) },
      {
        status: wEnrollmentStatus.FINISH,
        enrollmentEndDate: new Date(), // Set end date to current date
      },
    );

    return { updated: result.modifiedCount };
  }
}
