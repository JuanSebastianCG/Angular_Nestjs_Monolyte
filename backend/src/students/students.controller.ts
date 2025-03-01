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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  MongoIdParam,
  UserIdParam,
} from '../common/validation/mongo-id-validation';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param() params: MongoIdParam) {
    return this.studentsService.findOne(params.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  findByUserId(@Param() params: UserIdParam) {
    return this.studentsService.findByUserId(params.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param() params: MongoIdParam) {
    return this.studentsService.remove(params.id);
  }
}
