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
import { StudentGradesService } from './student-grades.service';
import { CreateStudentGradeDto } from './dto/create-student-grade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('student-grades')
export class StudentGradesController {
  constructor(private readonly studentGradesService: StudentGradesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createStudentGradeDto: CreateStudentGradeDto) {
    return this.studentGradesService.create(createStudentGradeDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.studentGradesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('student/:studentId')
  findAllByStudent(@Param('studentId') studentId: string) {
    return this.studentGradesService.findAllByStudent(studentId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('evaluation/:evaluationId')
  findAllByEvaluation(@Param('evaluationId') evaluationId: string) {
    return this.studentGradesService.findAllByEvaluation(evaluationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':evaluationId/:studentId')
  findOne(
    @Param('evaluationId') evaluationId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.studentGradesService.findOne(evaluationId, studentId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':evaluationId/:studentId')
  update(
    @Param('evaluationId') evaluationId: string,
    @Param('studentId') studentId: string,
    @Body() updateStudentGradeDto: Partial<CreateStudentGradeDto>,
  ) {
    return this.studentGradesService.update(
      evaluationId,
      studentId,
      updateStudentGradeDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':evaluationId/:studentId')
  remove(
    @Param('evaluationId') evaluationId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.studentGradesService.remove(evaluationId, studentId);
  }
}
