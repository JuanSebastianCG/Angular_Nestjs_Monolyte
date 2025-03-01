import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { ProfessorsService } from '../professors/professors.service';
import { SchedulesService } from '../schedules/schedules.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    private professorsService: ProfessorsService,
    private schedulesService: SchedulesService,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    // Verify professor exists
    await this.professorsService.findOne(createCourseDto.professorId);

    // Verify schedule exists
    await this.schedulesService.findOne(createCourseDto.scheduleId);

    // Create new course
    const newCourse = new this.courseModel(createCourseDto);
    return newCourse.save();
  }

  async findAll(): Promise<Course[]> {
    return this.courseModel
      .find()
      .populate('professorId')
      .populate('scheduleId')
      .exec();
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseModel
      .findById(id)
      .populate('professorId')
      .populate('scheduleId')
      .exec();

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  async update(
    id: string,
    updateCourseDto: Partial<CreateCourseDto>,
  ): Promise<Course> {
    // Verify course exists
    await this.findOne(id);

    // Verify professor exists if provided
    if (updateCourseDto.professorId) {
      await this.professorsService.findOne(updateCourseDto.professorId);
    }

    // Verify schedule exists if provided
    if (updateCourseDto.scheduleId) {
      await this.schedulesService.findOne(updateCourseDto.scheduleId);
    }

    const updatedCourse = await this.courseModel
      .findByIdAndUpdate(id, updateCourseDto, { new: true })
      .populate('professorId')
      .populate('scheduleId')
      .exec();

    if (!updatedCourse) {
      throw new NotFoundException(
        `Course with ID ${id} not found after update`,
      );
    }

    return updatedCourse;
  }

  async remove(id: string): Promise<Course> {
    const course = await this.courseModel.findByIdAndDelete(id).exec();

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }
}
