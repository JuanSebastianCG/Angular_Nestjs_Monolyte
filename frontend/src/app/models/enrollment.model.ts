import { Course } from './course.model';
import { Student } from './student.model';

/* [
  {
    "_id": "67cc6e70bad0d96a6d3da876",
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
    "enrollmentStartDate": "2023-09-05T00:00:00.000Z",
    "enrollmentEndDate": "2023-12-15T00:00:00.000Z",
    "status": "start",
    "createdAt": "2025-03-08T16:21:04.819Z",
    "updatedAt": "2025-03-08T16:21:04.819Z",
    "__v": 0
  }
] */

export enum EnrollmentStatus {
  START = 'start',
  FINISH = 'finish',
}

export interface Enrollment {
  _id: string;
  studentId: Student;
  courseId: Course;
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string;
}
