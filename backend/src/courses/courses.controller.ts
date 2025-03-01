import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MongoIdParam } from '../common/validation/mongo-id-validation';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  findOne(@Param() params: MongoIdParam) {
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
