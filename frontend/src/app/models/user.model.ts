/* [
  {
    "_id": "67cc6e2fbad0d96a6d3da81e",
    "name": "Student Name",
    "birthDate": "2000-01-01T00:00:00.000Z",
    "username": "studentuser",
    "email": "student@example.com",
    "password": "$2b$10$3MxQexRCqDTueuzz9CqgYOTOu6epmyjLPxM0ComF/8vmvzF7tB/..",
    "role": "student",
    "createdAt": "2025-03-08T16:19:59.241Z",
    "updatedAt": "2025-03-08T16:19:59.241Z",
    "__v": 0,
    "studentInfo": {
      "_id": "67cc6e2fbad0d96a6d3da823",
      "createdAt": "2025-03-08T16:19:59.602Z",
      "updatedAt": "2025-03-08T16:19:59.602Z",
      "__v": 0
    }
  },
  {
    "_id": "67cc6e37bad0d96a6d3da829",
    "name": "Admin User",
    "birthDate": "1990-01-01T00:00:00.000Z",
    "username": "adminuser",
    "email": "admin@example.com",
    "password": "$2b$10$zlZM5PEqm/0FLSc7zdDxn.RfyLq1JhiDo9/l07wSmWQxhtf/Eryca",
    "role": "admin",
    "createdAt": "2025-03-08T16:20:07.070Z",
    "updatedAt": "2025-03-08T16:20:07.070Z",
    "__v": 0
  },
  {
    "_id": "67cc6e52bad0d96a6d3da839",
    "name": "Professor Name",
    "birthDate": "1980-01-01T00:00:00.000Z",
    "username": "professoruser",
    "email": "professor@example.com",
    "password": "$2b$10$Zl51OtAusvmeQp/nNQrrcuIR9Bqjkeu9ZPL2GRy7F59BgcUh3LJ/q",
    "role": "professor",
    "createdAt": "2025-03-08T16:20:34.626Z",
    "updatedAt": "2025-03-08T16:20:34.626Z",
    "__v": 0,
    "professorInfo": {
      "_id": "67cc6e53bad0d96a6d3da83f",
      "hiringDate": "2023-01-15T00:00:00.000Z",
      "departmentId": "67cc6e40bad0d96a6d3da831",
      "createdAt": "2025-03-08T16:20:35.043Z",
      "updatedAt": "2025-03-08T16:20:35.043Z",
      "__v": 0
    }
  }
] */

import { ProfessorNoUserId } from './professor.model';
import { StudentNoUserId } from './student.model';

export interface User {
  _id: string;
  name: string;
  birthDate: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfessor extends User {
  professorInfo: ProfessorNoUserId;
}

export interface UserStudent extends User {
  studentInfo: StudentNoUserId;
}

export interface LoginUserDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}
