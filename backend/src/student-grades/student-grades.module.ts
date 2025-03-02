import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentGradesController } from './student-grades.controller';
import { StudentGradesService } from './student-grades.service';
import {
  StudentGrade,
  StudentGradeSchema,
} from './schemas/student-grade.schema';
import { StudentsModule } from '../students/students.module';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentGrade.name, schema: StudentGradeSchema },
    ]),
    StudentsModule,
    EvaluationsModule,
    EnrollmentsModule,
    UserModule,
  ],
  controllers: [StudentGradesController],
  providers: [StudentGradesService],
  exports: [StudentGradesService],
})
export class StudentGradesModule {}
