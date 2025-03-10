import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course, CourseSchema } from './schemas/course.schema';
import { ProfessorsModule } from '../professors/professors.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { PrerequisitesModule } from '../prerequisites/prerequisites.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
    forwardRef(() => ProfessorsModule),
    SchedulesModule,
    forwardRef(() => PrerequisitesModule),
    forwardRef(() => EnrollmentsModule),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
