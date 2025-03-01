import { IsMongoId } from 'class-validator';

// Basic MongoDB ID validation
export class MongoIdParam {
  @IsMongoId()
  id: string;
}

// UserID validation
export class UserIdParam {
  @IsMongoId()
  userId: string;
}

// Student ID validation
export class StudentIdParam {
  @IsMongoId()
  studentId: string;
}

// Course ID validation
export class CourseIdParam {
  @IsMongoId()
  courseId: string;
}

// Department ID validation
export class DepartmentIdParam {
  @IsMongoId()
  departmentId: string;
}

// Evaluation ID validation
export class EvaluationIdParam {
  @IsMongoId()
  evaluationId: string;
}

// Schedule ID validation
export class ScheduleIdParam {
  @IsMongoId()
  scheduleId: string;
}

// Composite params for routes with multiple IDs
export class CourseStudentParams {
  @IsMongoId()
  courseId: string;

  @IsMongoId()
  studentId: string;
}

export class EvaluationStudentParams {
  @IsMongoId()
  evaluationId: string;

  @IsMongoId()
  studentId: string;
}

export class PrerequisiteParams {
  @IsMongoId()
  courseId: string;

  @IsMongoId()
  prerequisiteCourseId: string;
}
