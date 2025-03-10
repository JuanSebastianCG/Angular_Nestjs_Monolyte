import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { Evaluation, EvaluationSchema } from './schemas/evaluation.schema';
import { CoursesModule } from '../courses/courses.module';
import { StudentGradesModule } from '../student-grades/student-grades.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evaluation.name, schema: EvaluationSchema },
    ]),
    CoursesModule,
    forwardRef(() => StudentGradesModule),
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
