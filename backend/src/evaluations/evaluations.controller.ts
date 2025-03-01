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
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createEvaluationDto: CreateEvaluationDto) {
    return this.evaluationsService.create(createEvaluationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.evaluationsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('course/:courseId')
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.evaluationsService.findAllByCourse(courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evaluationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEvaluationDto: Partial<CreateEvaluationDto>,
  ) {
    return this.evaluationsService.update(id, updateEvaluationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evaluationsService.remove(id);
  }
}
