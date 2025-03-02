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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('prerequisites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrerequisitesController {
  constructor(private readonly prerequisitesService: PrerequisitesService) {}

  @Post()
  @Roles('admin', 'professor')
  create(@Body() createPrerequisiteDto: CreatePrerequisiteDto) {
    return this.prerequisitesService.create(createPrerequisiteDto);
  }

  @Get()
  findAll() {
    return this.prerequisitesService.findAll();
  }

  @Get('course/:courseId')
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.prerequisitesService.findAllByCourse(courseId);
  }

  @Delete(':courseId/:prerequisiteCourseId')
  @Roles('admin', 'professor')
  remove(
    @Param('courseId') courseId: string,
    @Param('prerequisiteCourseId') prerequisiteCourseId: string,
  ) {
    return this.prerequisitesService.remove(courseId, prerequisiteCourseId);
  }
}
