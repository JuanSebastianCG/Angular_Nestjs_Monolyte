import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfessorsController } from './professors.controller';
import { ProfessorsService } from './professors.service';
import { Professor, ProfessorSchema } from './schemas/professor.schema';
import { UserModule } from '../user/user.module';
import { DepartmentsModule } from '../departments/departments.module';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Professor.name, schema: ProfessorSchema },
    ]),
    forwardRef(() => UserModule),
    DepartmentsModule,
    forwardRef(() => CoursesModule),
  ],
  controllers: [ProfessorsController],
  providers: [ProfessorsService],
  exports: [ProfessorsService],
})
export class ProfessorsModule {}
