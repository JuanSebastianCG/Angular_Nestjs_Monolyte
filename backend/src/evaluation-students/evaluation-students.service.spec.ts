import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationStudentsService } from './evaluation-students.service';

describe('EvaluationStudentsService', () => {
  let service: EvaluationStudentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EvaluationStudentsService],
    }).compile();

    service = module.get<EvaluationStudentsService>(EvaluationStudentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
