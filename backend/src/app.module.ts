import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DepartmentsModule } from './departments/departments.module';
import { ProfessorsModule } from './professors/professors.module';
import { CoursesModule } from './courses/courses.module';
import { PrerequisitesModule } from './prerequisites/prerequisites.module';
import { SchedulesModule } from './schedules/schedules.module';
import { StudentsModule } from './students/students.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { EvaluationStudentsModule } from './evaluation-students/evaluation-students.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    AuthModule,
    DepartmentsModule,
    ProfessorsModule,
    CoursesModule,
    PrerequisitesModule,
    SchedulesModule,
    StudentsModule,
    EnrollmentsModule,
    EvaluationsModule,
    EvaluationStudentsModule,
    ConfigModule,
    DatabaseModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
