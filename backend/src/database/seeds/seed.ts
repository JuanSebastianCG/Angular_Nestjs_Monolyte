import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UserService } from '../../user/user.service';
import { DepartmentsService } from '../../departments/departments.service';
import { CoursesService } from '../../courses/courses.service';
import { StudentsService } from '../../students/students.service';
import { ProfessorsService } from '../../professors/professors.service';
import { EnrollmentsService } from '../../enrollments/enrollments.service';
import { EvaluationsService } from '../../evaluations/evaluations.service';
import { StudentGradesService } from '../../student-grades/student-grades.service';
import * as mongoose from 'mongoose';
import { Logger } from '@nestjs/common';
import { Professor } from '../../professors/schemas/professor.schema';
import { Student } from '../../students/schemas/student.schema';
import { Course } from '../../courses/schemas/course.schema';
import { Enrollment } from '../../enrollments/schemas/enrollment.schema';
import { Evaluation } from '../../evaluations/schemas/evaluation.schema';

// Define a type that includes MongoDB document properties
type WithId<T> = T & { _id: mongoose.Types.ObjectId | string };

// Export for use in main.ts
export async function seedDatabase(app?: any) {
  const standalone = !app;
  if (standalone) {
    app = await NestFactory.createApplicationContext(AppModule);
  }

  const logger = new Logger('DatabaseSeeder');

  try {
    logger.log('Starting database seeding...');

    // Get services
    const userService = app.get(UserService);
    const departmentsService = app.get(DepartmentsService);
    const coursesService = app.get(CoursesService);
    const studentsService = app.get(StudentsService);
    const professorsService = app.get(ProfessorsService);
    const enrollmentsService = app.get(EnrollmentsService);
    const evaluationsService = app.get(EvaluationsService);
    const studentGradesService = app.get(StudentGradesService);

    // Clear existing data (optional - be careful in production!)
    logger.log('Clearing existing data...');
    await clearDatabase();

    // Create admin user
    logger.log('Creating admin user...');
    const admin = await userService.createAdmin({
      name: 'Admin User',
      username: 'admin',
      email: 'admin@university.edu',
      password: 'admin123',
      birthDate: new Date('1985-01-01'),
    });
    logger.log(`Admin created: ${admin.username} (${admin._id})`);

    // Create departments
    logger.log('Creating departments...');
    const departments = await Promise.all([
      departmentsService.create({
        name: 'Computer Science',
        description: 'Study of computers and computational systems',
      }),
      departmentsService.create({
        name: 'Mathematics',
        description: 'Study of numbers, quantities, and shapes',
      }),
      departmentsService.create({
        name: 'Physics',
        description: 'Study of matter, energy, and their interactions',
      }),
    ]);
    logger.log(`Created ${departments.length} departments`);

    // Create professors
    logger.log('Creating professors...');
    const professors: WithId<Professor>[] = [];
    for (let i = 0; i < 5; i++) {
      const profUser = await userService.create({
        name: `Professor ${i + 1}`,
        username: `professor${i + 1}`,
        email: `professor${i + 1}@university.edu`,
        password: 'password123',
        birthDate: new Date(`${1960 + i}-01-01`),
        role: 'professor',
      });

      const department = departments[i % departments.length];

      if (profUser._id) {
        const professor = await professorsService.create({
          userId: profUser._id.toString(),
          departmentId: department._id.toString(),
          hiringDate: new Date(`${2010 + i}-09-01`),
        });

        // Use type assertion to tell TypeScript this object has _id
        professors.push(professor as WithId<Professor>);
      }
    }
    logger.log(`Created ${professors.length} professors`);

    // Create students
    logger.log('Creating students...');
    const students: WithId<Student>[] = [];
    for (let i = 0; i < 20; i++) {
      const studentUser = await userService.create({
        name: `Student ${i + 1}`,
        username: `student${i + 1}`,
        email: `student${i + 1}@university.edu`,
        password: 'password123',
        birthDate: new Date(
          `${1995 + (i % 10)}-${(i % 12) + 1}-${(i % 28) + 1}`,
        ),
        role: 'student',
      });

      if (studentUser._id) {
        // Check your CreateStudentDto to see what fields it accepts
        const student = await studentsService.create({
          userId: studentUser._id.toString(),
          // If enrollmentDate doesn't exist in CreateStudentDto, remove it or rename to the correct field
          // enrollmentDate: new Date(`${2020 + (i % 4)}-09-01`),
        });

        // Use type assertion
        students.push(student as WithId<Student>);
      }
    }
    logger.log(`Created ${students.length} students`);

    // Create courses
    logger.log('Creating courses...');
    const courses: WithId<Course>[] = [];
    const courseNames = [
      'Introduction to Programming',
      'Data Structures and Algorithms',
      'Database Systems',
      'Web Development',
      'Artificial Intelligence',
      'Calculus I',
      'Linear Algebra',
      'Statistics',
      'Quantum Physics',
      'Mechanics',
    ];

    for (let i = 0; i < courseNames.length; i++) {
      const department = departments[i % departments.length];
      const professor = professors[i % professors.length];

      // Check your CreateCourseDto to see what fields it accepts
      const course = await coursesService.create({
        name: courseNames[i],
        // If code doesn't exist in CreateCourseDto, remove it or rename to the correct field
        // code: `${department.name.substring(0, 3).toUpperCase()}${100 + i}`,
        credits: 3 + (i % 3),
        description: `This course covers ${courseNames[i].toLowerCase()}`,
        departmentId: department._id.toString(),
        professorId: professor._id.toString(),
      });

      // Use type assertion
      courses.push(course as WithId<Course>);
    }
    logger.log(`Created ${courses.length} courses`);

    // Create enrollments
    logger.log('Creating enrollments...');
    const enrollments: WithId<Enrollment>[] = [];
    for (let i = 0; i < students.length; i++) {
      // Each student enrolls in 3-5 courses
      const numCourses = 3 + (i % 3);

      for (let j = 0; j < numCourses; j++) {
        const courseIndex = (i + j) % courses.length;

        try {
          // Check your CreateEnrollmentDto to see what fields it accepts
          const enrollment = await enrollmentsService.create({
            studentId: students[i]._id.toString(),
            courseId: courses[courseIndex]._id.toString(),
            // If enrollmentDate doesn't exist in CreateEnrollmentDto, remove it or rename to the correct field
            // enrollmentDate: new Date(`${2023}-09-${1 + (i % 5)}`),
            status: 'active',
          });

          // Use type assertion
          enrollments.push(enrollment as WithId<Enrollment>);
        } catch (error) {
          // Skip if enrollment already exists
          logger.warn(
            `Skipping duplicate enrollment: Student ${i + 1} in Course ${courseIndex + 1}`,
          );
        }
      }
    }
    logger.log(`Created ${enrollments.length} enrollments`);

    // Create evaluations
    logger.log('Creating evaluations...');
    const evaluations: WithId<Evaluation>[] = [];
    const evaluationTypes = [
      'Midterm Exam',
      'Final Exam',
      'Quiz',
      'Project',
      'Assignment',
    ];

    for (let i = 0; i < courses.length; i++) {
      // Each course has 3-5 evaluations
      const numEvaluations = 3 + (i % 3);

      for (let j = 0; j < numEvaluations; j++) {
        const evaluationType = evaluationTypes[j % evaluationTypes.length];
        const weight = j === 1 ? 40 : 20; // Final exam is 40%, others are 20%

        // Check your CreateEvaluationDto to see what fields it accepts
        const evaluation = await evaluationsService.create({
          courseId: courses[i]._id.toString(),
          // If title doesn't exist in CreateEvaluationDto, remove it or rename to the correct field
          // title: `${evaluationType} ${j+1}`,
          name: `${evaluationType} ${j + 1}`, // Assuming 'name' is the correct field instead of 'title'
          description: `${evaluationType} for ${courses[i].name}`,
          date: new Date(`2023-${9 + j * 2}-15`),
          maxGrade: 100,
          weight: weight,
        });

        // Use type assertion
        evaluations.push(evaluation as WithId<Evaluation>);
      }
    }
    logger.log(`Created ${evaluations.length} evaluations`);

    // Create student grades
    logger.log('Creating student grades...');
    let gradesCount = 0;

    for (const enrollment of enrollments) {
      // Get all evaluations for this course
      const courseEvaluations = evaluations.filter(
        (e) => e.courseId.toString() === enrollment.courseId.toString(),
      );

      // Create grades for each evaluation
      for (const evaluation of courseEvaluations) {
        // Random grade between 60 and 100
        const grade = Math.floor(Math.random() * 41) + 60;

        try {
          await studentGradesService.create({
            studentId: enrollment.studentId.toString(),
            evaluationId: evaluation._id.toString(),
            grade: grade,
            comments: getGradeComment(grade),
          });

          gradesCount++;
        } catch (error) {
          logger.warn(`Error creating grade: ${error.message}`);
        }
      }
    }
    logger.log(`Created ${gradesCount} student grades`);

    logger.log('Database seeding completed successfully!');
  } catch (error) {
    logger.error(`Error during database seeding: ${error.message}`);
    logger.error(error.stack);
  } finally {
    if (standalone) {
      await app.close();
    }
  }
}

async function clearDatabase() {
  // Be very careful with this in production!
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

function getGradeComment(grade: number): string {
  if (grade >= 90) return 'Excellent work!';
  if (grade >= 80) return 'Good job!';
  if (grade >= 70) return 'Satisfactory performance.';
  return 'Needs improvement.';
}

// Only run bootstrap if this file is executed directly
if (require.main === module) {
  bootstrap();
}

async function bootstrap() {
  await seedDatabase();
}
