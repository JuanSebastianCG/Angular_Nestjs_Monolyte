import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
  InternalServerErrorException,
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
import { EnrollmentsService } from '../enrollments/enrollments.service';
import * as mongoose from 'mongoose';

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
    @Inject(forwardRef(() => ProfessorsService))
    private professorsService: ProfessorsService,
    private schedulesService: SchedulesService,
    @Inject(forwardRef(() => PrerequisitesService))
    private prerequisitesService: PrerequisitesService,
    @Inject(forwardRef(() => EnrollmentsService))
    private enrollmentsService: EnrollmentsService,
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    let createdScheduleId: string | null = null;

    try {
      // We'll use the professorId directly as a userId
      // No need to look up the professor first
      if (createCourseDto.professorId) {
        console.log(
          `Using user ID directly as professor: ${createCourseDto.professorId}`,
        );
      }

      // Step 1: Create schedule if provided
      if (createCourseDto.schedule && !createCourseDto.scheduleId) {
        console.log(
          'Creating new schedule:',
          JSON.stringify(createCourseDto.schedule),
        );

        // Create the schedule first
        const newSchedule = await this.schedulesService.create(
          createCourseDto.schedule,
        );

        // IMPORTANT: Extract the ID properly
        // Convert to plain JavaScript object first to access _id
        const scheduleObj = newSchedule.toObject
          ? newSchedule.toObject()
          : newSchedule;

        // Log the schedule object to debug
        console.log('Created schedule object:', JSON.stringify(scheduleObj));

        // Use type assertion to access _id property
        const scheduleAny = scheduleObj as any;
        if (!scheduleAny._id) {
          throw new BadRequestException(
            'Failed to get ID from created schedule',
          );
        }

        // Convert the ObjectId to string and store it
        createdScheduleId = scheduleAny._id.toString();
        console.log('Extracted schedule ID:', createdScheduleId);

        // Create a new DTO without the schedule object but with the ID
        const newCourseData = {
          name: createCourseDto.name,
          description: createCourseDto.description,
          professorId: createCourseDto.professorId, // Use the user ID directly
          scheduleId: createdScheduleId,
        };

        console.log(
          'Creating course with data:',
          JSON.stringify(newCourseData),
        );

        // Create and save the course with proper ObjectId conversion
        const course = new this.courseModel(newCourseData);
        const savedCourse = await course.save();
        console.log(
          'Course created successfully with ID:',
          (savedCourse as any)._id,
        );

        // Find and return the populated course
        return this.findOne((savedCourse as any)._id.toString());
      } else if (createCourseDto.scheduleId) {
        // If scheduleId is directly provided, use it
        console.log('Using provided scheduleId:', createCourseDto.scheduleId);

        // Create the course with existing scheduleId
        const courseData = {
          name: createCourseDto.name,
          description: createCourseDto.description,
          professorId: createCourseDto.professorId, // Use the user ID directly
          scheduleId: createCourseDto.scheduleId,
        };

        // Ensure the schedule exists
        await this.schedulesService.findOne(createCourseDto.scheduleId);

        console.log('Creating course with data:', JSON.stringify(courseData));

        // Create and save the course
        const course = new this.courseModel(courseData);
        const savedCourse = await course.save();

        // Find and return the populated course
        return this.findOne((savedCourse as any)._id.toString());
      } else {
        throw new BadRequestException(
          'Either scheduleId or schedule object must be provided',
        );
      }
    } catch (error) {
      // If we created a schedule but failed to create the course, delete the schedule
      if (createdScheduleId) {
        try {
          console.log('Deleting orphaned schedule:', createdScheduleId);
          await this.schedulesService.remove(createdScheduleId);
        } catch (cleanupError) {
          console.error(
            'Failed to delete orphaned schedule:',
            cleanupError.message,
          );
        }
      }

      // Log detailed error and re-throw
      console.error('Error creating course:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      } else {
        throw new BadRequestException(
          `Failed to create course: ${error.message}`,
        );
      }
    }
  }

  async findAll(
    options: {
      includePrerequisites?: boolean;
      professorId?: string;
    } = {},
  ): Promise<Course[]> {
    // Build query based on provided filters
    const query: any = {};

    // Add professorId filter if provided - use directly as userId
    if (options.professorId) {
      console.log(`Using ID directly as userId filter: ${options.professorId}`);
      query.professorId = new mongoose.Types.ObjectId(options.professorId);
    }

    const courses = await this.courseModel
      .find(query)
      .populate({
        path: 'professorId',
        select: '-password', // Exclude password field
      })
      .populate('scheduleId')
      .exec();

    // If we don't want prerequisites or don't have the service, return as is
    if (!options.includePrerequisites || !this.prerequisitesService) {
      return courses;
    }

    console.log(`Found ${courses.length} courses, fetching prerequisites...`);

    // Add prerequisites to each course
    const coursesWithPrerequisites = await Promise.all(
      courses.map(async (course) => {
        try {
          // Use the improved findOne method to get course with prerequisites
          const courseId = (course as any)._id?.toString();
          if (!courseId) {
            console.error('Course has no _id:', course);
            return course;
          }

          console.log(`Fetching prerequisites for course ${courseId}`);
          const courseWithPrereqs = await this.findOne(courseId, {
            skipPrerequisites: false,
            depth: 1,
          });
          return courseWithPrereqs;
        } catch (error) {
          console.error(`Error fetching prerequisites for course:`, error);
          // If there's an error, return the course without prerequisites
          const plainCourse = course.toObject ? course.toObject() : course;
          // Make sure the return object has all required fields
          return {
            ...plainCourse,
            prerequisites: [],
            error: error.message,
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
    // Set default option values
    const skipPrerequisites = options.skipPrerequisites === true;
    const depth = options.depth !== undefined ? options.depth : 3; // Default depth of 3 levels

    // Find the course and populate its references
    const course = await this.courseModel
      .findById(id)
      .populate({
        path: 'professorId',
        select: '-password', // Exclude password field
      })
      .populate('scheduleId')
      .exec();

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    console.log('Found course:', id);
    console.log('Professor/User ID:', course.professorId?.toString() || 'None');
    console.log('Schedule ID:', course.scheduleId?.toString() || 'None');

    // If prerequisites should be skipped or the service is not available, return the course as is
    if (skipPrerequisites || !this.prerequisitesService) {
      return course;
    }

    // Get prerequisites if depth limit not reached
    if (depth < 5) {
      try {
        console.log(`Getting prerequisites for course ${id}`);
        const prerequisites =
          await this.prerequisitesService.findAllByCourse(id);
        console.log(`Found ${prerequisites.length} prerequisites`);

        // Convert course to plain object for better JSON handling
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

                console.log(`Fetching prerequisite course: ${prereqId}`);

                // Get full course details with one level less of prerequisites
                const prereqCourse = await this.findOne(prereqId.toString(), {
                  depth: depth + 1,
                });

                return prereqCourse;
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
          // No prerequisites found
          return {
            ...courseObj,
            prerequisites: [],
          } as unknown as Course;
        }
      } catch (error) {
        console.error(
          `Error processing prerequisites for course ${id}:`,
          error,
        );
        // Return the course without prerequisites in case of error
        return {
          ...course.toObject(),
          prerequisites: [],
          error: error.message,
        } as unknown as Course;
      }
    } else {
      // Depth limit reached, return without prerequisites
      return {
        ...course.toObject(),
        prerequisites: [],
        depthLimitReached: true,
      } as unknown as Course;
    }
  }

  async update(
    id: string,
    updateCourseDto: Partial<CreateCourseDto>,
  ): Promise<Course> {
    // Verify course exists
    const existingCourse = await this.findOne(id);
    let newScheduleCreated = false;
    let newScheduleId: string | null = null;

    try {
      // We'll use the professorId directly as a userId
      // No need to look up the professor first
      if (updateCourseDto.professorId) {
        console.log(
          `Using user ID directly as professor: ${updateCourseDto.professorId}`,
        );
      }

      // Check if a new schedule object is provided
      if (updateCourseDto.schedule && !updateCourseDto.scheduleId) {
        console.log(
          'Creating new schedule:',
          JSON.stringify(updateCourseDto.schedule),
        );

        // Create a new schedule
        const newSchedule = await this.schedulesService.create(
          updateCourseDto.schedule,
        );

        // Extract just the ID as a string
        let extractedId: string | null = null;

        // First try with toObject() if available
        if (typeof newSchedule.toObject === 'function') {
          const plainObj = newSchedule.toObject();
          extractedId = plainObj._id?.toString() || null;
        }

        // If toObject() didn't work or didn't give us an ID, try direct access with type assertion
        if (!extractedId) {
          const scheduleWithId = newSchedule as unknown as { _id?: any };
          if (scheduleWithId._id) {
            extractedId = scheduleWithId._id.toString();
          }
        }

        // If we still don't have an ID, throw an error
        if (!extractedId) {
          console.error(
            'Failed to extract ID from schedule:',
            JSON.stringify(newSchedule),
          );
          throw new BadRequestException(
            'Failed to get valid ID from created schedule',
          );
        }

        // Update the DTO with the new schedule ID
        updateCourseDto.scheduleId = extractedId;
        newScheduleId = extractedId;
        newScheduleCreated = true;

        // Remove the schedule object from the update data
        delete updateCourseDto.schedule;

        // Log for debugging
        console.log(
          `Using new scheduleId (string) for update: "${extractedId}"`,
        );
      }

      // Verify schedule exists if provided
      if (updateCourseDto.scheduleId) {
        await this.schedulesService.findOne(updateCourseDto.scheduleId);
      }

      // Check for professor schedule conflicts
      // Use the new professorId if provided, otherwise use the existing one
      const professorId =
        updateCourseDto.professorId ||
        (existingCourse.professorId
          ? existingCourse.professorId.toString()
          : undefined);

      // Use the new scheduleId if provided, otherwise use the existing one
      const scheduleId =
        updateCourseDto.scheduleId ||
        (existingCourse.scheduleId
          ? existingCourse.scheduleId.toString()
          : undefined);

      if (professorId && scheduleId) {
        const hasConflict = await this.checkProfessorScheduleConflicts(
          professorId,
          scheduleId,
          id, // Exclude the current course from conflict check
        );

        if (hasConflict) {
          // If there's a conflict and we created a new schedule, delete it
          if (newScheduleCreated && newScheduleId) {
            await this.schedulesService.remove(newScheduleId);
          }

          throw new ConflictException(
            `The assigned professor already has a course scheduled during this time slot. Please choose a different time or professor.`,
          );
        }
      }

      // Log the final update data for debugging
      console.log(
        'Updating course with data:',
        JSON.stringify(updateCourseDto),
      );

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
    } catch (error) {
      // If an error occurs and we created a new schedule, delete it
      if (newScheduleCreated && newScheduleId) {
        try {
          await this.schedulesService.remove(newScheduleId);
        } catch (deleteError) {
          console.error(
            `Failed to delete schedule after course update error: ${deleteError.message}`,
          );
        }
      }

      // Re-throw the original error with more context
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      } else {
        console.error('Error updating course:', error);
        throw new BadRequestException(
          `Failed to update course: ${error.message}`,
        );
      }
    }
  }

  async remove(id: string): Promise<Course> {
    const course = await this.courseModel.findById(id).exec();

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Delete all prerequisite relationships associated with this course
    if (this.prerequisitesService) {
      try {
        const result = await this.prerequisitesService.deleteAllForCourse(id);
        if (result.deletedCount > 0) {
          console.log(
            `Deleted ${result.deletedCount} prerequisite relationships for course ${id}`,
          );
        }
      } catch (error) {
        // Log the error but continue with course deletion
        console.error(
          `Failed to delete prerequisite relationships: ${error.message}`,
        );
      }
    }

    // Delete all enrollment records for this course
    try {
      // Find all enrollments for this course
      const enrollments = await this.enrollmentsService.findAllByCourse(id);
      console.log(`Found ${enrollments.length} enrollments for course ${id}`);

      // Delete each enrollment
      for (const enrollment of enrollments) {
        const studentId = enrollment.studentId.toString();
        console.log(
          `Deleting enrollment for student ${studentId} in course ${id}`,
        );
        await this.enrollmentsService.remove(studentId, id);
      }

      console.log(
        `Deleted all ${enrollments.length} enrollments for course ${id}`,
      );
    } catch (error) {
      // Log the error but continue with course deletion
      console.error(
        `Failed to delete enrollments for course: ${error.message}`,
      );
    }

    // Delete the associated schedule if it exists
    if (course.scheduleId) {
      try {
        await this.schedulesService.remove(course.scheduleId.toString());
      } catch (error) {
        // Log the error but continue with course deletion
        console.error(`Failed to delete associated schedule: ${error.message}`);
      }
    }

    // Now delete the course
    const deletedCourse = await this.courseModel.findByIdAndDelete(id).exec();

    // Add null check to satisfy TypeScript
    if (!deletedCourse) {
      throw new InternalServerErrorException(
        `Course with ID ${id} was found but could not be deleted`,
      );
    }

    return deletedCourse;
  }

  /**
   * Checks if a professor has any scheduling conflicts with the given schedule
   * @param userId The ID of the user (professor)
   * @param scheduleId The ID of the schedule to check
   * @param excludeCourseId Optional course ID to exclude from the check (for updates)
   * @returns true if there's a conflict, false otherwise
   */
  private async checkProfessorScheduleConflicts(
    userId: string,
    scheduleId: string,
    excludeCourseId?: string,
  ): Promise<boolean> {
    // Get the schedule details
    const schedule = await this.schedulesService.findOne(scheduleId);

    // Get all courses for this user (professor)
    const professorCourses = await this.findAll({ professorId: userId });

    // Filter out the course being updated (if provided)
    const otherCourses = excludeCourseId
      ? professorCourses.filter((course) => {
          // Access _id safely using type casting
          const courseId = (course as any)._id?.toString() || '';
          return courseId !== excludeCourseId;
        })
      : professorCourses;

    // No other courses means no conflicts
    if (otherCourses.length === 0) {
      return false;
    }

    // Get all schedule IDs from the professor's other courses
    const scheduleIds = otherCourses.map((course) =>
      course.scheduleId.toString(),
    );

    // Get all schedules for comparison
    const schedules = await Promise.all(
      scheduleIds.map((id) => this.schedulesService.findOne(id)),
    );

    // Check for conflicts with each schedule
    for (const otherSchedule of schedules) {
      // Check for day overlap
      const dayOverlap = schedule.days.some((day) =>
        otherSchedule.days.includes(day),
      );

      if (!dayOverlap) continue;

      // Check if date ranges overlap
      const dateRangesOverlap =
        schedule.startDate <= otherSchedule.endDate &&
        schedule.endDate >= otherSchedule.startDate;

      if (!dateRangesOverlap) continue;

      // Check for time overlap
      const timeOverlap =
        schedule.startTime < otherSchedule.endTime &&
        schedule.endTime > otherSchedule.startTime;

      if (timeOverlap) {
        return true; // Found a conflict
      }
    }

    return false; // No conflicts found
  }
}
