import { Module } from '@nestjs/common';
import { EvaluationStudentsController } from './evaluation-students.controller';
import { EvaluationStudentsService } from './evaluation-students.service';

@Module({
  controllers: [EvaluationStudentsController],
  providers: [EvaluationStudentsService],
})
export class EvaluationStudentsModule {}
