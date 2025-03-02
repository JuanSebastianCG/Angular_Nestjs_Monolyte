import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrerequisitesController } from './prerequisites.controller';
import { PrerequisitesService } from './prerequisites.service';
import {
  Prerequisite,
  PrerequisiteSchema,
} from './schemas/prerequisite.schema';
import { CoursesModule } from '../courses/courses.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prerequisite.name, schema: PrerequisiteSchema },
    ]),
    forwardRef(() => CoursesModule),
    AuthModule,
  ],
  controllers: [PrerequisitesController],
  providers: [PrerequisitesService],
  exports: [PrerequisitesService],
})
export class PrerequisitesModule {}
