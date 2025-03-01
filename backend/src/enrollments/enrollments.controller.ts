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
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.enrollmentsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('student/:studentId')
  findAllByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentsService.findAllByStudent(studentId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('course/:courseId')
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.enrollmentsService.findAllByCourse(courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':studentId/:courseId')
  findOne(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentsService.findOne(studentId, courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':studentId/:courseId')
  update(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
    @Body() updateEnrollmentDto: Partial<CreateEnrollmentDto>,
  ) {
    return this.enrollmentsService.update(
      studentId,
      courseId,
      updateEnrollmentDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':studentId/:courseId')
  remove(
    @Param('studentId') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentsService.remove(studentId, courseId);
  }
}
