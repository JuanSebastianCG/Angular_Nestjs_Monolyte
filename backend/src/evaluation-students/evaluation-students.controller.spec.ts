import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationStudentsController } from './evaluation-students.controller';

describe('EvaluationStudentsController', () => {
  let controller: EvaluationStudentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationStudentsController],
    }).compile();

    controller = module.get<EvaluationStudentsController>(
      EvaluationStudentsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
