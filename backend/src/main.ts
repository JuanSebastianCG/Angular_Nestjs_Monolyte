import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import * as process from 'process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const logger = new Logger('Bootstrap');

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Register the global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('University API')
    .setDescription('API for university management system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Check if we should seed the database
  if (process.env.SEED_DB === 'true') {
    logger.log('Seeding database...');
    const { seedDatabase } = require('./database/seeds/seed');
    await seedDatabase(app);
    logger.log('Database seeded successfully!');
  }

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
