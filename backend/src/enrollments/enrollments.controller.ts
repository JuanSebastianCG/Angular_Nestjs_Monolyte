import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  StudentIdParam,
  CourseIdParam,
  CourseStudentParams,
} from '../common/validation/mongo-id-validation';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @Request() req,
  ) {
    // For student role, ensure studentId matches logged-in user
    if (req.user.role === 'student') {
      createEnrollmentDto.studentId = req.user.userId;
    }

    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.enrollmentsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('student/:studentId')
  findAllByStudent(@Param() params: StudentIdParam) {
    return this.enrollmentsService.findAllByStudent(params.studentId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('course/:courseId')
  findAllByCourse(@Param() params: CourseIdParam) {
    return this.enrollmentsService.findAllByCourse(params.courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':studentId/:courseId')
  findOne(@Param() params: CourseStudentParams) {
    return this.enrollmentsService.findOne(params.studentId, params.courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':studentId/:courseId')
  update(
    @Param() params: CourseStudentParams,
    @Body() updateEnrollmentDto: Partial<CreateEnrollmentDto>,
  ) {
    return this.enrollmentsService.update(
      params.studentId,
      params.courseId,
      updateEnrollmentDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':studentId/:courseId')
  remove(@Param() params: CourseStudentParams) {
    return this.enrollmentsService.remove(params.studentId, params.courseId);
  }
}
