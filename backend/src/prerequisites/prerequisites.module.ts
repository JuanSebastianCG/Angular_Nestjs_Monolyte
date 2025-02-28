import { Module } from '@nestjs/common';
import { PrerequisitesController } from './prerequisites.controller';
import { PrerequisitesService } from './prerequisites.service';

@Module({
  controllers: [PrerequisitesController],
  providers: [PrerequisitesService],
})
export class PrerequisitesModule {}
