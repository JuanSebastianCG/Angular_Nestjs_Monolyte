import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ProfessorsService } from '../professors/professors.service';
import { SchedulesService } from '../schedules/schedules.service';
import { Schedule } from '../schedules/schemas/schedule.schema';
import { PrerequisitesService } from '../prerequisites/prerequisites.service';

// Export this interface so it can be used by controllers
export interface CourseWithPrerequisites extends Document {
  _id: any;
  name: string;
  description: string;
  professorId: any;
  scheduleId: any;
  prerequisites: any[];
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    private professorsService: ProfessorsService,
    private schedulesService: SchedulesService,
    @Inject(forwardRef(() => PrerequisitesService))
    private prerequisitesService: PrerequisitesService,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    let scheduleId = createCourseDto.scheduleId;

    // If schedule object is provided instead of scheduleId
    if (!scheduleId && createCourseDto.schedule) {
      // Create a new schedule
      const newSchedule = await this.schedulesService.create(
        createCourseDto.schedule,
      );
      // Use type assertion to access _id property
      scheduleId = (newSchedule as any)._id.toString();
    } else if (!scheduleId) {
      throw new BadRequestException(
        'Either scheduleId or schedule object must be provided',
      );
    }

    // Create the course with the schedule ID
    const courseData = {
      ...createCourseDto,
      scheduleId, // Use the scheduleId we determined
    };

    // Remove the schedule object from the course data
    delete courseData.schedule;

    const course = new this.courseModel(courseData);
    return course.save();
  }

  async findAll(
    options: { includePrerequisites?: boolean } = {},
  ): Promise<Course[]> {
    const courses = await this.courseModel
      .find()
      .populate('professorId')
      .populate('scheduleId')
      .exec();

    // If we don't want prerequisites or don't have the service, return as is
    if (!options.includePrerequisites || !this.prerequisitesService) {
      return courses;
    }

    // Add prerequisites to each course
    const coursesWithPrerequisites = await Promise.all(
      courses.map(async (course) => {
        try {
          // Use the existing findOne method with depth=0 to get first level prerequisites
          const courseWithPrereqs = await this.findOne(
            course._id?.toString() || '', // Handle potentially undefined _id
            { skipPrerequisites: false, depth: 0 },
          );
          return courseWithPrereqs;
        } catch (error) {
          console.error(`Error fetching prerequisites for course:`, error);
          // If there's an error, return the course without prerequisites
          const plainCourse = course.toObject();
          // Make sure the return object has all required fields
          return {
            ...plainCourse,
            prerequisites: [],
          };
        }
      }),
    );

    // TypeScript doesn't like this, but we know the structure is correct
    return coursesWithPrerequisites as unknown as Course[];
  }

  async findOne(
    id: string,
    options: { skipPrerequisites?: boolean; depth?: number } = {},
  ): Promise<Course> {
    const course = await this.courseModel
      .findById(id)
      .populate('professorId')
      .populate('scheduleId')
      .exec();

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Get prerequisites if prerequisitesService is available AND skipPrerequisites flag is false
    if (this.prerequisitesService && !options.skipPrerequisites) {
      const depth = options.depth !== undefined ? options.depth : 0;

      if (depth < 5) {
        const prerequisites =
          await this.prerequisitesService.findAllByCourse(id);

        const courseObj = course.toObject();

        if (prerequisites.length > 0) {
          const prerequisiteDetails = await Promise.all(
            prerequisites.map(async (prereq) => {
              try {
                // Check if prerequisiteCourseId is a populated document or just an ID
                const prereqId =
                  typeof prereq.prerequisiteCourseId === 'object' &&
                  prereq.prerequisiteCourseId !== null
                    ? (prereq.prerequisiteCourseId as any)._id // Cast to any to bypass TypeScript checks
                    : prereq.prerequisiteCourseId;

                // Get full course details
                const prereqCourse = await this.courseModel
                  .findById(prereqId)
                  .populate('professorId')
                  .populate('scheduleId')
                  .exec();

                if (!prereqCourse) {
                  throw new Error(`Prerequisite course not found: ${prereqId}`);
                }

                // Convert to plain object for proper JSON serialization
                return prereqCourse.toObject();
              } catch (error) {
                console.error(`Error fetching prerequisite:`, error);
                return {
                  _id: prereq.prerequisiteCourseId.toString(),
                  name: 'Unknown Course',
                  description: 'Failed to load course details',
                  error: error.message,
                };
              }
            }),
          );

          // Add prerequisites to our course object
          return {
            ...courseObj,
            prerequisites: prerequisiteDetails,
          } as unknown as Course;
        } else {
          return {
            ...courseObj,
            prerequisites: [],
          } as unknown as Course;
        }
      } else {
        return {
          ...course.toObject(),
          prerequisites: [],
        } as unknown as Course;
      }
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
