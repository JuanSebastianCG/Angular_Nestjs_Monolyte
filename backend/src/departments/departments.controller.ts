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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MongoIdParam } from '../common/validation/mongo-id-validation';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param() params: MongoIdParam) {
    return this.departmentsService.findOne(params.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param() params: MongoIdParam,
    @Body() updateDepartmentDto: Partial<CreateDepartmentDto>,
  ) {
    return this.departmentsService.update(params.id, updateDepartmentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param() params: MongoIdParam) {
    return this.departmentsService.remove(params.id);
  }
}
