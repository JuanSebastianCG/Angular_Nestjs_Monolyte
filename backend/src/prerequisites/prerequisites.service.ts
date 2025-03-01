import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    private coursesService: CoursesService,
  ) {}

  async create(
    createPrerequisiteDto: CreatePrerequisiteDto,
  ): Promise<Prerequisite> {
    const { courseId, prerequisiteCourseId } = createPrerequisiteDto;

    // Prevent self-reference
    if (courseId === prerequisiteCourseId) {
      throw new BadRequestException(
        'A course cannot be a prerequisite of itself',
      );
    }

    // Verify both courses exist
    await this.coursesService.findOne(courseId);
    await this.coursesService.findOne(prerequisiteCourseId);

    // Check if the prerequisite already exists
    const existingPrerequisite = await this.prerequisiteModel.findOne({
      courseId,
      prerequisiteCourseId,
    });

    if (existingPrerequisite) {
      throw new ConflictException(
        'This prerequisite relationship already exists',
      );
    }

    // Create new prerequisite
    const newPrerequisite = new this.prerequisiteModel(createPrerequisiteDto);
    return newPrerequisite.save();
  }

  async findAllForCourse(courseId: string): Promise<Prerequisite[]> {
    return this.prerequisiteModel
      .find({ courseId })
      .populate('prerequisiteCourseId')
      .exec();
  }

  async findAll(): Promise<Prerequisite[]> {
    return this.prerequisiteModel
      .find()
      .populate('courseId')
      .populate('prerequisiteCourseId')
      .exec();
  }

  async remove(
    courseId: string,
    prerequisiteCourseId: string,
  ): Promise<Prerequisite> {
    const prerequisite = await this.prerequisiteModel.findOneAndDelete({
      courseId,
      prerequisiteCourseId,
    });

    if (!prerequisite) {
      throw new NotFoundException('Prerequisite relationship not found');
    }

    return prerequisite;
  }
}
