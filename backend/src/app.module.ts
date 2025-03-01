import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { ProfessorsModule } from './professors/professors.module';
import { DepartmentsModule } from './departments/departments.module';
import { SchedulesModule } from './schedules/schedules.module';
import { CoursesModule } from './courses/courses.module';
import { PrerequisitesModule } from './prerequisites/prerequisites.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { StudentGradesModule } from './student-grades/student-grades.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/university',
      }),
    }),
    UserModule,
    AuthModule,
    StudentsModule,
    ProfessorsModule,
    DepartmentsModule,
    SchedulesModule,
    CoursesModule,
    PrerequisitesModule,
    EnrollmentsModule,
    EvaluationsModule,
    StudentGradesModule,
  ],
})
export class AppModule {}
