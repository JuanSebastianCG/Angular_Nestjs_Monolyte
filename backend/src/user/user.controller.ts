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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MongoIdParam } from '../common/validation/mongo-id-validation';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    if (createUserDto.role === 'admin') {
      createUserDto.role = 'user';
    }
    return this.userService.create(createUserDto);
  }

  @Post('admin')
  createAdmin(@Body() createUserDto: CreateUserDto) {
    // Use the dedicated admin creation method
    return this.userService.createAdmin(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard, OwnerGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, OwnerGuard)
  @Patch(':id')
  update(
    @Param() params: MongoIdParam,
    @Body() updateUserDto: Partial<CreateUserDto>,
  ) {
    if (updateUserDto.role === 'admin') {
      delete updateUserDto.role;
    }
    return this.userService.update(params.id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
