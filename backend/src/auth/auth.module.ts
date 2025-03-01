import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { StudentsModule } from '../students/students.module';
import { ProfessorsModule } from '../professors/professors.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthToken, AuthTokenSchema } from './schemas/auth-token.schema';
import { DepartmentsModule } from '../departments/departments.module';
import { RolesGuard } from './guards/roles.guard';
import { OwnerGuard } from './guards/owner.guard';

@Module({
  imports: [
    forwardRef(() => UserModule),
    StudentsModule,
    ProfessorsModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: AuthToken.name, schema: AuthTokenSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
        },
      }),
    }),
    DepartmentsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, OwnerGuard],
  exports: [AuthService, JwtModule, RolesGuard, OwnerGuard],
})
export class AuthModule {}
