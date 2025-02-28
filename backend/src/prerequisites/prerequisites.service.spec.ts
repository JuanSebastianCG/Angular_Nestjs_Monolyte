import { Test, TestingModule } from '@nestjs/testing';
import { PrerequisitesService } from './prerequisites.service';

describe('PrerequisitesService', () => {
  let service: PrerequisitesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrerequisitesService],
    }).compile();

    service = module.get<PrerequisitesService>(PrerequisitesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
