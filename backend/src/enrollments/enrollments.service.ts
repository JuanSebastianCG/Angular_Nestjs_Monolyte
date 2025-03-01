import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { StudentsService } from '../students/students.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    private studentsService: StudentsService,
    private coursesService: CoursesService,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    const { studentId, courseId } = createEnrollmentDto;

    // Verify student exists
    await this.studentsService.findOne(studentId);

    // Verify course exists
    await this.coursesService.findOne(courseId);

    // Check if enrollment already exists
    const existingEnrollment = await this.enrollmentModel.findOne({
      studentId,
      courseId,
    });

    if (existingEnrollment) {
      throw new ConflictException('Student is already enrolled in this course');
    }

    // Create new enrollment
    const newEnrollment = new this.enrollmentModel({
      ...createEnrollmentDto,
      enrollmentStartDate:
        createEnrollmentDto.enrollmentStartDate || new Date(),
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

  async findAllByStudent(studentId: string): Promise<Enrollment[]> {
    // Verify student exists
    await this.studentsService.findOne(studentId);

    return this.enrollmentModel.find({ studentId }).populate('courseId').exec();
  }

  async findAllByCourse(courseId: string): Promise<Enrollment[]> {
    // Verify course exists
    await this.coursesService.findOne(courseId);

    return this.enrollmentModel.find({ courseId }).populate('studentId').exec();
  }

  async findOne(studentId: string, courseId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findOne({ studentId, courseId })
      .populate('studentId')
      .populate('courseId')
      .exec();

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment for student ${studentId} in course ${courseId} not found`,
      );
    }

    return enrollment;
  }

  async update(
    studentId: string,
    courseId: string,
    updateEnrollmentDto: Partial<CreateEnrollmentDto>,
  ): Promise<Enrollment> {
    // Find the enrollment
    await this.findOne(studentId, courseId);

    // Update only fields that don't change the enrollment identity
    const {
      studentId: newStudentId,
      courseId: newCourseId,
      ...updateFields
    } = updateEnrollmentDto;

    const updatedEnrollment = await this.enrollmentModel
      .findOneAndUpdate({ studentId, courseId }, updateFields, { new: true })
      .populate('studentId')
      .populate('courseId')
      .exec();

    if (!updatedEnrollment) {
      throw new NotFoundException(
        `Enrollment for student ${studentId} in course ${courseId} not found after update`,
      );
    }

    return updatedEnrollment;
  }

  async remove(studentId: string, courseId: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel
      .findOneAndDelete({ studentId, courseId })
      .exec();

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment for student ${studentId} in course ${courseId} not found`,
      );
    }

    return enrollment;
  }
}
