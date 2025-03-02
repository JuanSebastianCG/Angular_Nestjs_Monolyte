import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MongoIdParam } from '../common/validation/mongo-id-validation';
import { Course } from './schemas/course.schema';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCourseDto: CreateCourseDto): Promise<Course> {
    return this.coursesService.create(createCourseDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('includePrerequisites') includePrerequisites?: string,
  ): Promise<Course[]> {
    return this.coursesService.findAll({
      includePrerequisites: includePrerequisites !== 'false',
    });
  }

  @Get(':id')
  findOne(@Param() params: MongoIdParam): Promise<Course> {
    return this.coursesService.findOne(params.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param() params: MongoIdParam,
    @Body() updateCourseDto: Partial<CreateCourseDto>,
  ) {
    return this.coursesService.update(params.id, updateCourseDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param() params: MongoIdParam) {
    return this.coursesService.remove(params.id);
  }
}
