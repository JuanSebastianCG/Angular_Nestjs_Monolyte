import { Course, CourseJustId } from './course.model';
/* 
[
  {
    "_id": "67cc6e77bad0d96a6d3da885",
    "evaluationDate": "2023-10-15T00:00:00.000Z",
    "name": "Midterm Exam",
    "description": "Covers chapters 1-5",
    "maxScore": 100,
    "courseId": {
      "_id": "67cc6e66bad0d96a6d3da851",
      "name": "Introduction to Programming 2",
      "description": "Basic programming concepts",
      "professorId": "67cc6e52bad0d96a6d3da839",
      "scheduleId": "67cc6e66bad0d96a6d3da84f",
      "createdAt": "2025-03-08T16:20:54.857Z",
      "updatedAt": "2025-03-08T16:20:54.857Z",
      "__v": 0
    },
    "createdAt": "2025-03-08T16:21:11.632Z",
    "updatedAt": "2025-03-08T16:21:11.632Z",
    "__v": 0
  },
  {
    "_id": "67cc6e84bad0d96a6d3da892",
    "evaluationDate": "2023-12-01T00:00:00.000Z",
    "name": "Final Project",
    "description": "Implement a complete application",
    "maxScore": 100,
    "courseId": {
      "_id": "67cc6e69bad0d96a6d3da858",
      "name": "Advanced Data Structures",
      "description": "In-depth study of data structures and algorithms",
      "professorId": "67cc6e52bad0d96a6d3da839",
      "scheduleId": "67cc6e69bad0d96a6d3da856",
      "createdAt": "2025-03-08T16:20:57.269Z",
      "updatedAt": "2025-03-08T16:20:57.269Z",
      "__v": 0
    },
    "createdAt": "2025-03-08T16:21:24.150Z",
    "updatedAt": "2025-03-08T16:21:24.150Z",
    "__v": 0
  }
] */

/**
 * Enum for different evaluation types
 */
export enum EvaluationType {
  EXAM = 'exam',
  PROJECT = 'project',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
}

/**
 * Interface for evaluation data
 */
export interface Evaluation {
  _id?: string;
  name: string;
  description: string;
  maxScore: number;
  evaluationDate: string;
  courseId: CourseJustId | string;
  createdAt?: string;
  updatedAt?: string;
}

/*     "evaluationId": {
      "_id": "67cc6e84bad0d96a6d3da892",
      "evaluationDate": "2023-12-01T00:00:00.000Z",
      "name": "Final Project",
      "description": "Implement a complete application",
      "maxScore": 100,
      "courseId": "67cc6e69bad0d96a6d3da858",
      "createdAt": "2025-03-08T16:21:24.150Z",
      "updatedAt": "2025-03-08T16:21:24.150Z",
      "__v": 0
    }, */
/**
 * Interface for evaluation data with just IDs (no populated fields)
 */
export interface EvaluationJustId {
  _id: string;
  name: string;
  description: string;
  maxScore: number;
  evaluationDate: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for evaluation creation data
 */
export interface CreateEvaluationDTO {
  name: string;
  description: string;
  maxScore: number;
  evaluationDate: string;
  courseId: string;
}

/**
 * Interface for evaluation update data
 */
export interface UpdateEvaluationDTO {
  name?: string;
  description?: string;
  maxScore?: number;
  evaluationDate?: string;
}
