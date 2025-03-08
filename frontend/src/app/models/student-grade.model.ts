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

import { EvaluationJustId } from './evaluation.model';
import { Student } from './student.model';

export interface StudentGrade {
  _id: string;
  evaluationId: EvaluationJustId;
  studentId: Student;
  grade: number;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}
