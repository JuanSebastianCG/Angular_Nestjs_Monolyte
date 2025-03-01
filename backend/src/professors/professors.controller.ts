import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProfessorsService } from './professors.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  MongoIdParam,
  UserIdParam,
} from '../common/validation/mongo-id-validation';

@Controller('professors')
export class ProfessorsController {
  constructor(private readonly professorsService: ProfessorsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createProfessorDto: CreateProfessorDto) {
    return this.professorsService.create(createProfessorDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.professorsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param() params: MongoIdParam) {
    return this.professorsService.findOne(params.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  findByUserId(@Param() params: UserIdParam) {
    return this.professorsService.findByUserId(params.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param() params: MongoIdParam) {
    return this.professorsService.remove(params.id);
  }
}
