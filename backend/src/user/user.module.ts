import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from './schemas/user.schema';
import { StudentsModule } from '../students/students.module';
import { ProfessorsModule } from '../professors/professors.module';
import { DepartmentsModule } from '../departments/departments.module';
import { AuthModule } from '../auth/auth.module';
import { GuardsModule } from '../common/guards/guards.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => StudentsModule),
    forwardRef(() => ProfessorsModule),
    forwardRef(() => AuthModule),
    DepartmentsModule,
    GuardsModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
