import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PrerequisitesService } from './prerequisites.service';
import { CreatePrerequisiteDto } from './dto/create-prerequisite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('prerequisites')
export class PrerequisitesController {
  constructor(private readonly prerequisitesService: PrerequisitesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPrerequisiteDto: CreatePrerequisiteDto) {
    return this.prerequisitesService.create(createPrerequisiteDto);
  }

  @Get()
  findAll() {
    return this.prerequisitesService.findAll();
  }

  @Get('course/:courseId')
  findAllForCourse(@Param('courseId') courseId: string) {
    return this.prerequisitesService.findAllForCourse(courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':courseId/:prerequisiteCourseId')
  remove(
    @Param('courseId') courseId: string,
    @Param('prerequisiteCourseId') prerequisiteCourseId: string,
  ) {
    return this.prerequisitesService.remove(courseId, prerequisiteCourseId);
  }
}
