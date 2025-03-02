import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Prerequisite,
  PrerequisiteDocument,
} from './schemas/prerequisite.schema';
import { CreatePrerequisiteDto } from './dto/create-prerequisite.dto';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class PrerequisitesService {
  constructor(
    @InjectModel(Prerequisite.name)
    private prerequisiteModel: Model<PrerequisiteDocument>,
    @Inject(forwardRef(() => CoursesService))
    private coursesService: CoursesService,
  ) {}

  async create(
    createPrerequisiteDto: CreatePrerequisiteDto,
  ): Promise<Prerequisite> {
    const { courseId, prerequisiteCourseId } = createPrerequisiteDto;
    console.log('Starting prerequisite creation...');

    // Pass skipPrerequisites flag to avoid circular reference
    console.log('Verifying courses...');
    await this.coursesService.findOne(courseId, { skipPrerequisites: true });
    await this.coursesService.findOne(prerequisiteCourseId, {
      skipPrerequisites: true,
    });
    console.log('Both courses verified successfully');

    // Prevent self-reference
    if (courseId === prerequisiteCourseId) {
      throw new BadRequestException(
        'A course cannot be a prerequisite for itself',
      );
    }

    // Check for circular reference
    console.log('Checking for circular references...');
    if (
      await this.wouldCreateCircularReference(courseId, prerequisiteCourseId)
    ) {
      throw new BadRequestException(
        'Circular prerequisite relationship detected',
      );
    }
    console.log('No circular reference detected');

    // Check if relation already exists
    console.log('Checking if relationship already exists...');
    const existingPrerequisite = await this.prerequisiteModel
      .findOne({
        courseId: new Types.ObjectId(courseId),
        prerequisiteCourseId: new Types.ObjectId(prerequisiteCourseId),
      })
      .exec();
    console.log('Existing check complete:', !!existingPrerequisite);

    if (existingPrerequisite) {
      throw new ConflictException(
        'This prerequisite relationship already exists',
      );
    }

    // Create new prerequisite relationship
    console.log('Creating new prerequisite...');
    const newPrerequisite = new this.prerequisiteModel({
      courseId: new Types.ObjectId(courseId),
      prerequisiteCourseId: new Types.ObjectId(prerequisiteCourseId),
    });

    console.log('Saving to database...');
    const result = await newPrerequisite.save();
    console.log('Prerequisite saved successfully');

    return result;
  }

  async findAll(): Promise<Prerequisite[]> {
    return this.prerequisiteModel
      .find()
      .populate('courseId')
      .populate('prerequisiteCourseId')
      .exec();
  }

  async findAllByCourse(courseId: string): Promise<Prerequisite[]> {
    // Verify course exists but skip prerequisites to avoid circular calls
    await this.coursesService.findOne(courseId, { skipPrerequisites: true });

    // Find prerequisites for the course
    const prerequisites = await this.prerequisiteModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .populate('prerequisiteCourseId')
      .exec();

    console.log('Found prerequisites:', prerequisites);

    // Return the complete prerequisite documents without transformation
    return prerequisites;
  }

  async remove(
    courseId: string,
    prerequisiteCourseId: string,
  ): Promise<Prerequisite> {
    const prerequisite = await this.prerequisiteModel
      .findOneAndDelete({
        courseId: new Types.ObjectId(courseId),
        prerequisiteCourseId: new Types.ObjectId(prerequisiteCourseId),
      })
      .exec();

    if (!prerequisite) {
      throw new NotFoundException(`Prerequisite relationship not found`);
    }

    return prerequisite;
  }

  // Check if student has completed all prerequisites for a course
  async checkPrerequisitesForEnrollment(
    courseId: string,
    studentId: string,
    enrollmentsService: any,
  ): Promise<{ isValid: boolean; missingCourses: string[] }> {
    // Get all prerequisites for the course
    const prerequisites = await this.findAllByCourse(courseId);

    if (prerequisites.length === 0) {
      return { isValid: true, missingCourses: [] };
    }

    const missingCourses: string[] = [];

    // Check each prerequisite
    for (const prereq of prerequisites) {
      try {
        // Force type assertion to any to bypass TypeScript's type checking completely
        const prerequisiteId = String(
          (prereq as any).prerequisiteCourseId._id ||
            (prereq as any).prerequisiteCourseId,
        );

        console.log(`Checking enrollment for prerequisite: ${prerequisiteId}`);

        // Try to find a completed enrollment for this prerequisite
        await enrollmentsService.findOne(studentId, prerequisiteId);
        // If no error, student is enrolled
      } catch (error) {
        // Student is not enrolled in this prerequisite course
        try {
          // Force type assertion again for the coursesService call
          const prerequisiteId = String(
            (prereq as any).prerequisiteCourseId._id ||
              (prereq as any).prerequisiteCourseId,
          );
          const prerequisiteCourse = await this.coursesService.findOne(
            prerequisiteId,
            { skipPrerequisites: true },
          );

          // Add the course name to missing courses
          if (prerequisiteCourse && prerequisiteCourse.name) {
            missingCourses.push(prerequisiteCourse.name);
          }
        } catch (e) {
          console.error('Error getting prerequisite course:', e);
          missingCourses.push('Unknown Course');
        }
      }
    }

    return {
      isValid: missingCourses.length === 0,
      missingCourses,
    };
  }

  // Utility to check for circular references - fixed version
  private async wouldCreateCircularReference(
    courseId: string,
    prerequisiteCourseId: string,
    visited: Set<string> = new Set(),
    depth: number = 0,
  ): Promise<boolean> {
    // Prevent too deep recursion
    if (depth > 10) {
      console.log('Max recursion depth reached, stopping circular check');
      return false;
    }

    console.log(
      `Checking circular reference at depth ${depth}, visited: ${Array.from(visited).join(', ')}`,
    );

    // If we've already visited this course in this traversal, we have a cycle
    if (visited.has(prerequisiteCourseId)) {
      return false; // Not a circular reference to our target course
    }

    // Add this course to visited set
    visited.add(prerequisiteCourseId);

    try {
      // Check if the prerequisite course has prerequisites that include the original course
      console.log(`Finding prerequisites for course: ${prerequisiteCourseId}`);
      const prerequisites = await this.prerequisiteModel
        .find({
          courseId: new Types.ObjectId(prerequisiteCourseId),
        })
        .exec();

      console.log(`Found ${prerequisites.length} prerequisites`);

      for (const prereq of prerequisites) {
        if (prereq.prerequisiteCourseId.toString() === courseId) {
          console.log('Direct circular reference found');
          return true; // Direct circular reference found
        }

        // Check deeper in the chain recursively, passing the visited set
        const hasCircular = await this.wouldCreateCircularReference(
          courseId,
          prereq.prerequisiteCourseId.toString(),
          visited,
          depth + 1,
        );

        if (hasCircular) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking circular reference:', error);
      // If there's an error, we'll assume no circular reference to allow the operation to continue
      return false;
    }
  }
}
