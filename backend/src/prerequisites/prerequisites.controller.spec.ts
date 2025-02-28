import { Test, TestingModule } from '@nestjs/testing';
import { PrerequisitesController } from './prerequisites.controller';

describe('PrerequisitesController', () => {
  let controller: PrerequisitesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrerequisitesController],
    }).compile();

    controller = module.get<PrerequisitesController>(PrerequisitesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
