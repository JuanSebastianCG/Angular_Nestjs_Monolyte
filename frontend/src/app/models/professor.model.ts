import { Department } from './department.model';
import { User } from './user.model';

/* 
  {
    "_id": "67cc6e53bad0d96a6d3da83f",
    "hiringDate": "2023-01-15T00:00:00.000Z",
    "departmentId": {
      "_id": "67cc6e40bad0d96a6d3da831",
      "name": "Computer Science",
      "description": "Study of computers and computational systems",
      "createdAt": "2025-03-08T16:20:16.795Z",
      "updatedAt": "2025-03-08T16:20:16.795Z",
      "__v": 0
    },
    "userId": {
      "_id": "67cc6e52bad0d96a6d3da839",
      "name": "Professor Name",
      "birthDate": "1980-01-01T00:00:00.000Z",
      "username": "professoruser",
      "email": "professor@example.com",
      "role": "professor",
      "createdAt": "2025-03-08T16:20:34.626Z",
      "updatedAt": "2025-03-08T16:20:34.626Z",
      "__v": 0
    },
    "createdAt": "2025-03-08T16:20:35.043Z",
    "updatedAt": "2025-03-08T16:20:35.043Z",
    "__v": 0
  }
] */
export interface Professor {
  _id: string;
  hiringDate: string;
  departmentId: Department;
  userId: User;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessorNoUserId {
  _id: string;
  hiringDate: string;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
}
