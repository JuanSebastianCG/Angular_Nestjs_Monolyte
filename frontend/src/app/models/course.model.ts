import { Prerequisite } from './prerequisite.model';
import { Schedule } from './schedule.model';

/* 
{
  "_id": "67cc6e66bad0d96a6d3da851",
  "name": "Introduction to Programming 2",
  "description": "Basic programming concepts",
  "professorId": null,
  "scheduleId": {
    "_id": "67cc6e66bad0d96a6d3da84f",
    "days": [
      "Monday",
      "Wednesday"
    ],
    "startTime": "6:00",
    "endTime": "3:30",
    "room": "A-101",
    "startDate": "2023-09-01T00:00:00.000Z",
    "endDate": "2023-12-15T00:00:00.000Z",
    "createdAt": "2025-03-08T16:20:54.758Z",
    "updatedAt": "2025-03-08T16:20:54.758Z",
    "__v": 0
  },
  "createdAt": "2025-03-08T16:20:54.857Z",
  "updatedAt": "2025-03-08T16:20:54.857Z",
  "__v": 0,
  "prerequisites": [
    {
      "_id": "67cc6e69bad0d96a6d3da858",
      "name": "Advanced Data Structures",
      "description": "In-depth study of data structures and algorithms",
      "professorId": null,
      "scheduleId": {
        "_id": "67cc6e69bad0d96a6d3da856",
        "days": [
          "Tuesday",
          "Thursday"
        ],
        "startTime": "15:00",
        "endTime": "19:30",
        "room": "B-201",
        "startDate": "2023-09-01T00:00:00.000Z",
        "endDate": "2023-12-15T00:00:00.000Z",
        "createdAt": "2025-03-08T16:20:57.183Z",
        "updatedAt": "2025-03-08T16:20:57.183Z",
        "__v": 0
      },
      "createdAt": "2025-03-08T16:20:57.269Z",
      "updatedAt": "2025-03-08T16:20:57.269Z",
      "__v": 0
    }
  ]
}
 */
export interface Course {
  _id: string;
  name: string;
  description: string;
  professorId: string;
  prerequisites?: Prerequisite[];
  scheduleId: Schedule;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

/*
  "_id": "67cc6e66bad0d96a6d3da851",
  "name": "Introduction to Programming 2",
  "description": "Basic programming concepts",
  "professorId": "67cc6e52bad0d96a6d3da839",
  "scheduleId": "67cc6e66bad0d96a6d3da84f",
  "createdAt": "2025-03-08T16:20:54.857Z",
  "updatedAt": "2025-03-08T16:20:54.857Z", 
*/
export interface CourseJustId {
  _id: string;
  name: string;
  description: string;
  professorId: string;
  scheduleId: string;
  createdAt: string;
  updatedAt: string;
}
