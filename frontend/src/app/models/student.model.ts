/*  
[
  {
    "_id": "67cc6e2fbad0d96a6d3da823",
    "userId": {
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
    "createdAt": "2025-03-08T16:19:59.602Z",
    "updatedAt": "2025-03-08T16:19:59.602Z",
    "__v": 0
  }
]
 */

import { User } from './user.model';

export interface Student {
  _id: string;
  userId: User;
  createdAt: string;
  updatedAt: string;
}

export interface StudentNoUserId {
  _id: string;
  createdAt: string;
  updatedAt: string;
}
