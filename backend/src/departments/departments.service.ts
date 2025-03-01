import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    // Check if department with same name already exists
    const existingDepartment = await this.departmentModel.findOne({
      name: createDepartmentDto.name,
    });

    if (existingDepartment) {
      throw new ConflictException(
        `Department with name ${createDepartmentDto.name} already exists`,
      );
    }

    // Create new department
    const newDepartment = new this.departmentModel(createDepartmentDto);
    return newDepartment.save();
  }

  async findAll(): Promise<Department[]> {
    return this.departmentModel.find().exec();
  }

  async findOne(id: string): Promise<Department> {
    try {
      // Check if the ID is a valid ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid department ID format: '${id}'`);
      }

      const department = await this.departmentModel.findById(id).exec();

      if (!department) {
        throw new NotFoundException(`Department with ID ${id} not found`);
      }

      return department;
    } catch (error) {
      // Rethrow NestJS exceptions
      if (error instanceof mongoose.Error.CastError) {
        throw new BadRequestException(`Invalid department ID format: '${id}'`);
      }

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Log and rethrow other errors
      this.logger.error(
        `Error finding department: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error retrieving department');
    }
  }

  async findByName(name: string): Promise<Department> {
    const department = await this.departmentModel.findOne({ name }).exec();

    if (!department) {
      throw new NotFoundException(`Department with name ${name} not found`);
    }

    return department;
  }

  async update(
    id: string,
    updateDepartmentDto: Partial<CreateDepartmentDto>,
  ): Promise<Department> {
    // Check if department exists
    await this.findOne(id);

    // If updating name, check if new name is already taken
    if (
      updateDepartmentDto.name &&
      (await this.departmentModel.exists({
        name: updateDepartmentDto.name,
        _id: { $ne: id },
      }))
    ) {
      throw new ConflictException(
        `Department with name ${updateDepartmentDto.name} already exists`,
      );
    }

    const updatedDepartment = await this.departmentModel
      .findByIdAndUpdate(id, updateDepartmentDto, { new: true })
      .exec();

    if (!updatedDepartment) {
      throw new NotFoundException(
        `Department with ID ${id} not found after update`,
      );
    }

    return updatedDepartment;
  }

  async remove(id: string): Promise<Department> {
    const department = await this.departmentModel.findByIdAndDelete(id).exec();

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }
}
