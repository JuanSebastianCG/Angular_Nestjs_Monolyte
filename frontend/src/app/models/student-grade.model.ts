/*   {
    "_id": "67cc6e87bad0d96a6d3da89d",
    "evaluationId": {
      "_id": "67cc6e84bad0d96a6d3da892",
      "evaluationDate": "2023-12-01T00:00:00.000Z",
      "name": "Final Project",
      "description": "Implement a complete application",
      "maxScore": 100,
      "courseId": "67cc6e69bad0d96a6d3da858",
      "createdAt": "2025-03-08T16:21:24.150Z",
      "updatedAt": "2025-03-08T16:21:24.150Z",
      "__v": 0
    },
    "studentId": {
      "_id": "67cc6e2fbad0d96a6d3da81e",
      "name": "Student Name",
      "birthDate": "2000-01-01T00:00:00.000Z",
      "username": "studentuser",
      "email": "student@example.com",
      "role": "student",
      "createdAt": "2025-03-08T16:19:59.241Z",
      "updatedAt": "2025-03-08T16:19:59.241Z",
      "__v": 0
    },
    "grade": 85,
    "comments": "Good work!",
    "createdAt": "2025-03-08T16:21:27.816Z",
    "updatedAt": "2025-03-08T16:21:27.816Z",
    "__v": 0
  }, */

import { Student } from './student.model';
import { EvaluationJustId } from './evaluation.model';

/**
 * Interface for student grade data
 */
export interface StudentGrade {
  _id: string;
  evaluationId: EvaluationJustId | string;
  studentId: Student | string;
  grade: number;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type guard to check if evaluationId is an EvaluationJustId object
 */
export function isEvaluationObject(
  evaluationId: EvaluationJustId | string,
): evaluationId is EvaluationJustId {
  return (
    typeof evaluationId !== 'string' &&
    evaluationId !== null &&
    '_id' in evaluationId
  );
}

/**
 * Type guard to check if studentId is a Student object
 */
export function isStudentObject(
  studentId: Student | string,
): studentId is Student {
  return (
    typeof studentId !== 'string' && studentId !== null && '_id' in studentId
  );
}

/**
 * Get evaluation ID from either string or object
 */
export function getEvaluationId(
  evaluationId: EvaluationJustId | string,
): string {
  return isEvaluationObject(evaluationId) ? evaluationId._id : evaluationId;
}

/**
 * Get student ID from either string or object
 */
export function getStudentId(studentId: Student | string): string {
  return isStudentObject(studentId) ? studentId._id : studentId;
}

/**
 * Interface for student grade creation data
 */
export interface CreateStudentGradeDTO {
  evaluationId: string;
  studentId: string;
  grade: number;
  comments?: string;
}

/**
 * Interface for student grade update data
 */
export interface UpdateStudentGradeDTO {
  grade: number;
  comments?: string;
}

/**
 * Interface for student grade with course data
 */
export interface StudentGradeWithCourse extends StudentGrade {
  courseName?: string;
  evaluationName?: string;
  maxScore?: number;
  percentage?: number;
}

/**
 * Interface for student grade summary
 */
export interface StudentGradeSummary {
  totalGrade: number;
  completedEvaluations: number;
  totalEvaluations: number;
  passStatus: 'passing' | 'failing' | 'incomplete';
}
